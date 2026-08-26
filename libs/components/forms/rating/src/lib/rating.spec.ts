import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoRating } from './rating';
import { DynamoRatingHarness } from './rating.harness';

function stars(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-star]'));
}

function star(container: HTMLElement, index: number): HTMLElement {
  const el = stars(container)[index];
  if (!el) {
    throw new Error(`No star at index ${index}`);
  }
  return el;
}

describe('DynamoRating', () => {
  describe('creation', () => {
    it('renders a role="slider" element', () => {
      const { container } = renderDynamoComponent(DynamoRating);

      expect(within(container).getByRole('slider')).toBeTruthy();
    });

    it('renders `max` stars', () => {
      const { container } = renderDynamoComponent(DynamoRating, {
        inputs: { max: 7 },
      });

      expect(stars(container)).toHaveLength(7);
    });
  });

  describe('default behavior', () => {
    it('defaults value to 0 and max to 5', () => {
      const { componentInstance } = renderDynamoComponent(DynamoRating);

      expect(componentInstance.value()).toBe(0);
      expect(componentInstance.max()).toBe(5);
    });
  });

  describe('user interactions', () => {
    it('clicking a star sets the value', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
      );

      await userEvent.click(star(container, 2));

      expect(componentInstance.value()).toBe(3);
    });

    it('clicking the already-selected star clears it to 0', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 3 } },
      );

      await userEvent.click(star(container, 2));

      expect(componentInstance.value()).toBe(0);
    });

    it('hovering previews the value without committing it', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoRating,
      );
      const root = within(container).getByRole('slider');

      fireEvent.mouseEnter(star(container, 3));
      fixture.detectChanges();
      expect(root.getAttribute('aria-valuenow')).toBe('4');
      expect(componentInstance.value()).toBe(0);

      fireEvent.mouseLeave(root);
      fixture.detectChanges();
      expect(root.getAttribute('aria-valuenow')).toBe('0');
      expect(componentInstance.value()).toBe(0);
    });
  });

  describe('keyboard navigation', () => {
    it('increments/decrements by 1 with ArrowRight/ArrowLeft', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 2 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toBe(3);

      await userEvent.keyboard('{ArrowLeft}');
      await userEvent.keyboard('{ArrowLeft}');
      expect(componentInstance.value()).toBe(1);
    });

    it('increments/decrements with ArrowUp/ArrowDown', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 2 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance.value()).toBe(3);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance.value()).toBe(2);
    });

    it('jumps to 0/max on Home/End', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 2, max: 5 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{End}');
      expect(componentInstance.value()).toBe(5);

      await userEvent.keyboard('{Home}');
      expect(componentInstance.value()).toBe(0);
    });

    it('clamps at the max boundary', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 5, max: 5 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toBe(5);
    });

    it('clamps at the 0 boundary', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowLeft}');
      expect(componentInstance.value()).toBe(0);
    });

    it('supports interaction through the DynamoRatingHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 2 } },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoRatingHarness,
      );

      expect(await harness.getValue()).toBe(2);
      await harness.increment();
      expect(componentInstance.value()).toBe(3);
      await harness.decrement();
      await harness.decrement();
      expect(componentInstance.value()).toBe(1);

      await harness.clickStar(5);
      expect(componentInstance.value()).toBe(5);
    });
  });

  describe('readOnly', () => {
    it('blocks click, hover, and keyboard interaction', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 2, readOnly: true } },
      );
      const root = within(container).getByRole('slider');
      root.focus();

      await userEvent.click(star(container, 4));
      fireEvent.mouseEnter(star(container, 4));
      await userEvent.keyboard('{ArrowRight}');

      expect(componentInstance.value()).toBe(2);
      expect(root.getAttribute('aria-readonly')).toBe('true');
    });
  });

  describe('disabled', () => {
    it('blocks all interaction and reflects aria-disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { value: 2, disabled: true } },
      );
      const root = within(container).getByRole('slider');

      await userEvent.click(star(container, 4));
      await userEvent.keyboard('{ArrowRight}');

      expect(componentInstance.value()).toBe(2);
      expect(root.getAttribute('aria-disabled')).toBe('true');
      expect(root.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('accessibility', () => {
    it('sets aria-valuemin/aria-valuemax and falls back aria-label to "Rating" when unset', () => {
      const { container } = renderDynamoComponent(DynamoRating, {
        inputs: { value: 3 },
      });

      const root = within(container).getByRole('slider');
      expect(root.getAttribute('aria-valuemin')).toBe('0');
      expect(root.getAttribute('aria-valuemax')).toBe('5');
      expect(root.getAttribute('aria-label')).toBe('Rating');
    });

    it('uses the provided ariaLabel when set', () => {
      const { container } = renderDynamoComponent(DynamoRating, {
        inputs: { ariaLabel: 'Product rating' },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-label'),
      ).toBe('Product rating');
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoRating, {
        inputs: { value: 3 },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('does not throw when max is 0', () => {
      const { container } = renderDynamoComponent(DynamoRating, {
        inputs: { max: 0 },
      });

      expect(stars(container)).toHaveLength(0);
    });

    it('does not throw when max is 1', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRating,
        { inputs: { max: 1 } },
      );

      await userEvent.click(star(container, 0));

      expect(componentInstance.value()).toBe(1);
    });
  });
});
