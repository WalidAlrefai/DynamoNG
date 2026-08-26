import { Component, model } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoCarousel } from './carousel';
import { DynamoCarouselSlide } from './carousel-slide';
import { DynamoCarouselHarness } from './carousel.harness';

@Component({
  selector: 'dg-carousel-test-host',
  standalone: true,
  imports: [DynamoCarousel, DynamoCarouselSlide],
  template: `
    <dg-carousel
      [(activeIndex)]="index"
      [loop]="loop()"
      [autoPlay]="autoPlay()"
      [autoPlayInterval]="autoPlayInterval()"
    >
      <dg-carousel-slide><p data-testid="slide-0">Slide 0</p></dg-carousel-slide>
      <dg-carousel-slide><p data-testid="slide-1">Slide 1</p></dg-carousel-slide>
      <dg-carousel-slide><p data-testid="slide-2">Slide 2</p></dg-carousel-slide>
    </dg-carousel>
  `,
})
class CarouselTestHostComponent {
  readonly index = model(0);
  readonly loop = model(true);
  readonly autoPlay = model(false);
  readonly autoPlayInterval = model(5000);
}

@Component({
  selector: 'dg-carousel-single-host',
  standalone: true,
  imports: [DynamoCarousel, DynamoCarouselSlide],
  template: `
    <dg-carousel>
      <dg-carousel-slide><p>Only slide</p></dg-carousel-slide>
    </dg-carousel>
  `,
})
class CarouselSingleHostComponent {}

@Component({
  selector: 'dg-carousel-empty-host',
  standalone: true,
  imports: [DynamoCarousel],
  template: `<dg-carousel></dg-carousel>`,
})
class CarouselEmptyHostComponent {}

function viewport(container: HTMLElement): HTMLElement {
  return within(container).getByTestId('carousel-viewport');
}

function dots(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[role="tablist"] button'));
}

describe('DynamoCarousel', () => {
  describe('creation', () => {
    it('renders one slide group per projected dg-carousel-slide, plus arrows and indicators', () => {
      const { container } = renderDynamoComponent(CarouselTestHostComponent);

      expect(container.querySelectorAll('[role="group"]')).toHaveLength(3);
      expect(
        within(container).getByRole('button', { name: 'Previous slide' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: 'Next slide' }),
      ).toBeTruthy();
      expect(dots(container)).toHaveLength(3);
    });
  });

  describe('default behavior', () => {
    it('starts on the first slide', () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );

      expect(componentInstance.index()).toBe(0);
      expect(dots(container)[0]?.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('navigation', () => {
    it('advances to the next slide on click and updates the two-way-bound activeIndex', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Next slide' }),
      );

      expect(componentInstance.index()).toBe(1);
    });

    it('moves to the previous slide on click', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
        { inputs: { index: 1 } },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Previous slide' }),
      );

      expect(componentInstance.index()).toBe(0);
    });

    it('wraps from the last slide to the first when looping (default)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
        { inputs: { index: 2 } },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Next slide' }),
      );

      expect(componentInstance.index()).toBe(0);
    });

    it('disables Next on the last slide and Previous on the first when loop is false', () => {
      const { container } = renderDynamoComponent(CarouselTestHostComponent, {
        inputs: { loop: false, index: 2 },
      });

      expect(
        within(container)
          .getByRole('button', { name: 'Next slide' })
          .hasAttribute('disabled'),
      ).toBe(true);
      expect(
        within(container)
          .getByRole('button', { name: 'Previous slide' })
          .hasAttribute('disabled'),
      ).toBe(false);
    });

    it('does not advance past the last slide when loop is false', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
        { inputs: { loop: false, index: 2 } },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Next slide' }),
      );

      expect(componentInstance.index()).toBe(2);
    });

    it('jumps directly to a slide via its indicator dot', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );

      await userEvent.click(dots(container)[2] as HTMLElement);

      expect(componentInstance.index()).toBe(2);
    });
  });

  describe('indicators', () => {
    it('marks exactly the active slide as aria-selected', () => {
      const { container } = renderDynamoComponent(CarouselTestHostComponent, {
        inputs: { index: 1 },
      });

      const selected = dots(container).filter(
        (dot) => dot.getAttribute('aria-selected') === 'true',
      );
      expect(selected).toHaveLength(1);
      expect(dots(container).indexOf(selected[0] as HTMLElement)).toBe(1);
    });

    it('gives only the active dot tabindex 0, all others -1', () => {
      const { container } = renderDynamoComponent(CarouselTestHostComponent, {
        inputs: { index: 1 },
      });

      const tabIndexes = dots(container).map((dot) => dot.tabIndex);
      expect(tabIndexes).toEqual([-1, 0, -1]);
    });
  });

  describe('viewport keyboard navigation', () => {
    it('moves to the next/previous slide with ArrowRight/ArrowLeft', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      viewport(container).focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.index()).toBe(1);

      await userEvent.keyboard('{ArrowLeft}');
      expect(componentInstance.index()).toBe(0);
    });

    it('jumps to the first/last slide on Home/End', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      viewport(container).focus();

      await userEvent.keyboard('{End}');
      expect(componentInstance.index()).toBe(2);

      await userEvent.keyboard('{Home}');
      expect(componentInstance.index()).toBe(0);
    });
  });

  describe('indicator keyboard navigation', () => {
    it('moves focus and activates immediately with ArrowRight/ArrowLeft, wrapping at the ends', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      dots(container)[0]?.focus();

      await userEvent.keyboard('{ArrowLeft}');

      expect(document.activeElement).toBe(dots(container)[2]);
      expect(componentInstance.index()).toBe(2);
    });

    it('jumps to the first/last dot on Home/End', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      dots(container)[0]?.focus();

      await userEvent.keyboard('{End}');

      expect(document.activeElement).toBe(dots(container)[2]);
      expect(componentInstance.index()).toBe(2);
    });

    it('supports interaction through the DynamoCarouselHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCarouselHarness,
      );

      expect(await harness.getSlideCount()).toBe(3);
      await harness.next();
      expect(componentInstance.index()).toBe(1);
      expect(await harness.getActiveIndex()).toBe(1);
      await harness.goTo(2);
      expect(componentInstance.index()).toBe(2);
      await harness.prev();
      expect(componentInstance.index()).toBe(1);
    });
  });

  describe('pointer drag', () => {
    // jsdom has no layout engine (every element reports clientWidth 0) and
    // doesn't implement setPointerCapture — clientWidth is mocked here so the
    // threshold math can be exercised; the real drag *feel* (setPointerCapture,
    // live 1:1 tracking) is only verifiable in a real browser, same category
    // of jsdom limitation as CDK's focus-trap Tab-wrapping (see Popover).
    function mockViewportWidth(el: HTMLElement, width: number): void {
      Object.defineProperty(el, 'clientWidth', {
        configurable: true,
        value: width,
      });
    }

    it('commits to the next slide when dragged past the threshold', () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      const viewportEl = viewport(container);
      mockViewportWidth(viewportEl, 200);

      fireEvent.pointerDown(viewportEl, { clientX: 150 });
      fireEvent.pointerMove(viewportEl, { clientX: 50 });
      fireEvent.pointerUp(viewportEl);

      expect(componentInstance.index()).toBe(1);
    });

    it('snaps back without navigating when dragged less than the threshold', () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      const viewportEl = viewport(container);
      mockViewportWidth(viewportEl, 200);

      fireEvent.pointerDown(viewportEl, { clientX: 150 });
      fireEvent.pointerMove(viewportEl, { clientX: 130 });
      fireEvent.pointerUp(viewportEl);

      expect(componentInstance.index()).toBe(0);
    });

    it('does not start a drag when the pointerdown originates on an arrow button', () => {
      const { container, componentInstance } = renderDynamoComponent(
        CarouselTestHostComponent,
      );
      const nextButton = within(container).getByRole('button', {
        name: 'Next slide',
      });
      mockViewportWidth(viewport(container), 200);

      fireEvent.pointerDown(nextButton, { clientX: 150 });
      fireEvent.pointerMove(viewport(container), { clientX: 50 });
      fireEvent.pointerUp(viewport(container));

      // A real drag past this distance would have advanced the slide — since
      // pointerdown originated on the button, no drag should have started.
      expect(componentInstance.index()).toBe(0);
    });
  });

  describe('inert offscreen slides', () => {
    it('marks only the non-active slides inert', () => {
      const { container } = renderDynamoComponent(CarouselTestHostComponent, {
        inputs: { index: 1 },
      });

      const groups = Array.from(
        container.querySelectorAll('[role="group"]'),
      ) as HTMLElement[];
      expect(groups.map((el) => el.hasAttribute('inert'))).toEqual([
        true,
        false,
        true,
      ]);
    });
  });

  describe('autoplay', () => {
    it('advances automatically on the configured interval', async () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        CarouselTestHostComponent,
        { inputs: { autoPlay: true, autoPlayInterval: 200 } },
      );
      void container;

      await new Promise((resolve) => setTimeout(resolve, 260));
      fixture.detectChanges();

      expect(componentInstance.index()).toBeGreaterThan(0);
    });

    it('pauses while the pointer hovers the carousel and resumes on leave', async () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        CarouselTestHostComponent,
        { inputs: { autoPlay: true, autoPlayInterval: 200 } },
      );
      const root = container.querySelector('section') as HTMLElement;
      fireEvent.pointerEnter(root);
      fixture.detectChanges();
      TestBed.flushEffects();

      await new Promise((resolve) => setTimeout(resolve, 260));
      fixture.detectChanges();

      expect(componentInstance.index()).toBe(0);

      fireEvent.pointerLeave(root);
      fixture.detectChanges();
      TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 260));
      fixture.detectChanges();

      expect(componentInstance.index()).toBeGreaterThan(0);
    });

    it('stops advancing once paused via the play/pause toggle', async () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        CarouselTestHostComponent,
        { inputs: { autoPlay: true, autoPlayInterval: 200 } },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Pause' }),
      );
      fixture.detectChanges();
      TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 260));
      fixture.detectChanges();

      expect(componentInstance.index()).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { fixture } = renderDynamoComponent(CarouselTestHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('gives the root a carousel role-description and each slide a slide role-description', () => {
      const { container } = renderDynamoComponent(CarouselTestHostComponent);

      expect(
        container
          .querySelector('section')
          ?.getAttribute('aria-roledescription'),
      ).toBe('carousel');
      expect(
        container
          .querySelector('[role="group"]')
          ?.getAttribute('aria-roledescription'),
      ).toBe('slide');
    });
  });

  describe('edge cases', () => {
    it('renders a single slide with no arrows or indicators', () => {
      const { container } = renderDynamoComponent(CarouselSingleHostComponent);

      expect(
        within(container).queryByRole('button', { name: 'Next slide' }),
      ).toBeNull();
      expect(container.querySelectorAll('[role="tablist"]')).toHaveLength(0);
    });

    it('does not throw with zero slides', () => {
      expect(() =>
        renderDynamoComponent(CarouselEmptyHostComponent),
      ).not.toThrow();
    });
  });
});
