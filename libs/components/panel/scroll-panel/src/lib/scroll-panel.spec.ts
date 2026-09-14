import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamoScrollPanel } from './scroll-panel';
import { DynamoScrollPanelHarness } from './scroll-panel.harness';
import type { DynamoScrollPanelMetrics } from './scroll-panel.types';

// `afterNextRender`'s callback (where the scroll listener/ResizeObserver
// are set up and the first metrics read happens) runs asynchronously after
// the initial render, not synchronously with construction — same
// "flush before asserting" idiom already used by DynamoVirtualScroll's own
// spec for the identical afterNextRender-driven-setup reason.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function viewportEl(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-testid="dg-scroll-panel-viewport"]',
  ) as HTMLElement;
}

// jsdom has no layout engine — scrollHeight/clientHeight/scrollWidth/
// clientWidth always read 0, and assigning .scrollTop/.scrollLeft never
// dispatches a native `scroll` event (both same category of jsdom
// limitation as Splitter's own `mockContainerRect` helper). Metrics are
// overridden directly; callers fire a `scroll` event afterward to make the
// component pick the new values up.
function mockScrollMetrics(
  el: HTMLElement,
  metrics: Partial<DynamoScrollPanelMetrics>,
): void {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(el, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
}

@Component({
  selector: 'dg-scroll-panel-test-host',
  standalone: true,
  imports: [DynamoScrollPanel],
  template: `
    <dg-scroll-panel styleClass="h-32 w-32">
      <p data-testid="content">Content</p>
    </dg-scroll-panel>
  `,
})
class ScrollPanelTestHostComponent {}

describe('DynamoScrollPanel', () => {
  describe('creation', () => {
    it('renders projected content', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);

      expect(within(container).getByTestId('content')).toBeTruthy();
    });

    it('renders no thumbs when content does not overflow', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeNull();
    });
  });

  describe('thumb visibility', () => {
    it('shows only the vertical thumb when only the Y axis overflows', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 100,
        clientWidth: 100,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeNull();
    });

    it('shows only the horizontal thumb when only the X axis overflows', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 100,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeNull();
    });

    it('shows both thumbs when both axes overflow', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeTruthy();
    });
  });

  describe('thumb size/position', () => {
    it('sizes and positions the vertical thumb proportionally to scroll progress', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 50,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;
      // size = clientHeight/scrollHeight = 100/200 = 50%.
      expect(thumbY.style.height).toBe('50%');
      // maxScrollTop = 200-100 = 100; posPct = (50/100)*(100-50) = 25%.
      expect(thumbY.style.top).toBe('25%');
    });

    it('sizes and positions the horizontal thumb proportionally to scroll progress', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 200,
        clientWidth: 100,
        scrollLeft: 50,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      const thumbX = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-x"]',
      ) as HTMLElement;
      expect(thumbX.style.width).toBe('50%');
      expect(thumbX.style.left).toBe('25%');
    });

    it('updates thumb position on a plain native scroll with no drag involved', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 0,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;
      expect(thumbY.style.top).toBe('0%');

      mockScrollMetrics(viewport, { scrollTop: 100 });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      expect(thumbY.style.top).toBe('50%');
    });
  });

  describe('drag', () => {
    it('dragging the vertical thumb sets scrollTop proportionally', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 0,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbY, { clientY: 100 });
      fireEvent.pointerMove(thumbY, { clientY: 150 });

      // trackLength = clientHeight = 100; thumbLengthPx = (100/200)*100 = 50;
      // travelPx = 50; maxScrollTop = 100; deltaPx = 50 -> deltaScrollTop = 100.
      expect(viewport.scrollTop).toBe(100);
    });

    it('dragging the horizontal thumb sets scrollLeft proportionally', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 200,
        clientWidth: 100,
        scrollLeft: 0,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();
      const thumbX = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-x"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbX, { clientX: 100 });
      fireEvent.pointerMove(thumbX, { clientX: 150 });

      expect(viewport.scrollLeft).toBe(100);
    });

    it('stops responding to pointermove after pointerup (vertical)', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 0,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbY, { clientY: 100 });
      fireEvent.pointerUp(thumbY);
      fireEvent.pointerMove(thumbY, { clientY: 200 });

      expect(viewport.scrollTop).toBe(0);
    });

    it('stops responding to pointermove after pointerup (horizontal)', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 200,
        clientWidth: 100,
        scrollLeft: 0,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();
      const thumbX = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-x"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbX, { clientX: 100 });
      fireEvent.pointerUp(thumbX);
      fireEvent.pointerMove(thumbX, { clientX: 200 });

      expect(viewport.scrollLeft).toBe(0);
    });
  });

  describe('ResizeObserver integration', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('observes both the viewport and content elements when ResizeObserver is available', async () => {
      const observed: unknown[] = [];
      class FakeResizeObserver {
        observe(target: unknown): void {
          observed.push(target);
        }
        unobserve(): void {
          /* no-op */
        }
        disconnect(): void {
          /* no-op */
        }
      }
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);

      const { fixture } = renderDynamoComponent(ScrollPanelTestHostComponent);
      await settle(fixture);

      expect(observed).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('has no tabindex when not scrollable', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);

      expect(viewportEl(container).getAttribute('tabindex')).toBeNull();
    });

    it('gets a tabindex once it becomes scrollable', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, { scrollHeight: 200, clientHeight: 100 });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      expect(viewport.getAttribute('tabindex')).toBe('0');
    });

    it('marks both thumbs aria-hidden', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      expect(
        container
          .querySelector('[data-testid="dg-scroll-panel-thumb-y"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
      expect(
        container
          .querySelector('[data-testid="dg-scroll-panel-thumb-x"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
    });

    it('has no axe violations when not scrollable', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when scrollable with both thumbs shown', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      await expectNoA11yViolations(container);
    });
  });

  describe('harness', () => {
    it('reports scroll position and per-axis thumb presence', async () => {
      const { fixture, container } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 40,
      });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoScrollPanelHarness,
      );

      expect(await harness.getScrollTop()).toBe(40);
      expect(await harness.getScrollLeft()).toBe(0);
      expect(await harness.hasVerticalThumb()).toBe(true);
      expect(await harness.hasHorizontalThumb()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('renders with no projected content without throwing', async () => {
      await expect(async () => {
        const { fixture } = renderDynamoComponent(DynamoScrollPanel);
        await settle(fixture);
      }).not.toThrow();
    });

    it('emits only styleClass on the root when unstyled', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoScrollPanel, {
        inputs: { unstyled: true, styleClass: 'custom-scroll-panel' },
      });
      await settle(fixture);

      expect(
        container.querySelector('[data-testid="DynamoScrollPanel"]')?.className,
      ).toBe('custom-scroll-panel');
    });
  });
});
