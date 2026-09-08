import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoKnob } from './knob';
import { DynamoKnobHarness } from './knob.harness';

// jsdom has no layout engine (getBoundingClientRect returns all zeros) and no
// setPointerCapture — same category of limitation as Slider's/Carousel's
// pointer-drag tests, fixed the same way: mock getBoundingClientRect. Unlike
// Slider's linear track, the dial's own [role="slider"] element IS the
// bounding box we need (there's no separate track/thumb split).
function mockDialRect(
  container: HTMLElement,
  left: number,
  top: number,
  size: number,
): void {
  const dial = within(container).getByRole('slider');
  dial.getBoundingClientRect = () =>
    ({
      left,
      top,
      width: size,
      height: size,
      right: left + size,
      bottom: top + size,
      x: left,
      y: top,
      toJSON: () => '',
    }) as DOMRect;
}

describe('DynamoKnob', () => {
  describe('creation', () => {
    it('renders a role="slider" element', () => {
      const { container } = renderDynamoComponent(DynamoKnob);

      expect(within(container).getByRole('slider')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults value/min/max/step/diameter/strokeWidth/showValue', () => {
      const { componentInstance } = renderDynamoComponent(DynamoKnob);

      expect(componentInstance.value()).toBe(0);
      expect(componentInstance.min()).toBe(0);
      expect(componentInstance.max()).toBe(100);
      expect(componentInstance.step()).toBe(1);
      expect(componentInstance.diameter()).toBe(100);
      expect(componentInstance.strokeWidth()).toBe(8);
      expect(componentInstance.showValue()).toBe(true);
    });
  });

  describe('clamping', () => {
    it.each([
      { value: -20, expected: 0 },
      { value: 0, expected: 0 },
      { value: 50, expected: 50 },
      { value: 100, expected: 100 },
      { value: 150, expected: 100 },
      { value: NaN, expected: 0 },
    ])(
      'clamps value=$value to $expected for aria-valuenow',
      ({ value, expected }) => {
        const { container } = renderDynamoComponent(DynamoKnob, {
          inputs: { value },
        });

        expect(
          within(container).getByRole('slider').getAttribute('aria-valuenow'),
        ).toBe(String(expected));
      },
    );

    it('snaps a non-step-aligned value to the nearest step', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { value: 23, step: 10 },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-valuenow'),
      ).toBe('20');
    });
  });

  describe('keyboard navigation', () => {
    it('increments/decrements by step with ArrowRight/ArrowLeft', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50, step: 5 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toBe(55);

      await userEvent.keyboard('{ArrowLeft}');
      await userEvent.keyboard('{ArrowLeft}');
      expect(componentInstance.value()).toBe(45);
    });

    it('increments/decrements by step with ArrowUp/ArrowDown', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance.value()).toBe(51);

      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance.value()).toBe(49);
    });

    it('jumps by step*10 on PageUp/PageDown', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50, step: 2 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{PageUp}');
      expect(componentInstance.value()).toBe(70);

      await userEvent.keyboard('{PageDown}');
      expect(componentInstance.value()).toBe(50);
    });

    it('jumps to min/max on Home/End', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50, min: 10, max: 90 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{End}');
      expect(componentInstance.value()).toBe(90);

      await userEvent.keyboard('{Home}');
      expect(componentInstance.value()).toBe(10);
    });

    it('clamps at the max boundary', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 99, step: 5 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toBe(100);
    });

    it('ignores keyboard input when disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50, disabled: true } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toBe(50);
    });

    it('supports interaction through the DynamoKnobHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoKnobHarness,
      );

      expect(await harness.getValue()).toBe(50);
      await harness.increment();
      expect(componentInstance.value()).toBe(51);
      await harness.decrement();
      await harness.decrement();
      expect(componentInstance.value()).toBe(49);
    });
  });

  describe('pointer interaction', () => {
    // The dial is a 200x200 square at (0,0), so its center is (100,100).
    // Clock positions are exact multiples of 90deg, so the angle math lands
    // on clean fractions of the range with no floating-point surprises.
    it('jumps to the value at 12 o\'clock (angle 0, ratio 0)', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      fireEvent.pointerDown(dial, { clientX: 100, clientY: 0 });

      expect(componentInstance.value()).toBe(0);
    });

    it('jumps to the value at 3 o\'clock (ratio 0.25)', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 0 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      fireEvent.pointerDown(dial, { clientX: 200, clientY: 100 });

      expect(componentInstance.value()).toBe(25);
    });

    it('jumps to the value at 6 o\'clock (ratio 0.5)', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 0 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      fireEvent.pointerDown(dial, { clientX: 100, clientY: 200 });

      expect(componentInstance.value()).toBe(50);
    });

    it('jumps to the value at 9 o\'clock (ratio 0.75)', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 0 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      fireEvent.pointerDown(dial, { clientX: 0, clientY: 100 });

      expect(componentInstance.value()).toBe(75);
    });

    // The one behavior worth over-testing: a full-circle dial has a
    // documented sharp edge at the 12 o'clock seam (see knob.ts). Two
    // screen positions a few pixels apart, both nearly straight up from
    // center, resolve to opposite ends of the range depending on which
    // side of dead-center they fall.
    it('resolves a pointer just clockwise of 12 o\'clock to near min', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      // Slightly clockwise of straight-up (toward 3 o'clock) -> near min.
      fireEvent.pointerDown(dial, { clientX: 105, clientY: 1 });

      expect(componentInstance.value()).toBeLessThanOrEqual(5);
    });

    // The one behavior worth over-testing: a full-circle dial has a
    // documented sharp edge at the 12 o'clock seam (see knob.ts). This case
    // and the one above fire on two screen positions a few pixels apart,
    // both nearly straight up from center, and resolve to opposite ends of
    // the range depending on which side of dead-center they fall.
    it('resolves a pointer just counter-clockwise of 12 o\'clock to near max', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      // Slightly counter-clockwise of straight-up (toward 9 o'clock) -> near max.
      fireEvent.pointerDown(dial, { clientX: 95, clientY: 1 });

      expect(componentInstance.value()).toBeGreaterThanOrEqual(95);
    });

    it('does not throw for a dead-center pointer', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      expect(() =>
        fireEvent.pointerDown(dial, { clientX: 100, clientY: 100 }),
      ).not.toThrow();
      expect(Number.isNaN(componentInstance.value())).toBe(false);
    });

    it('ignores pointer input against a zero-width rect', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 42 } },
      );
      mockDialRect(container, 0, 0, 0);
      const dial = within(container).getByRole('slider');

      fireEvent.pointerDown(dial, { clientX: 100, clientY: 100 });

      expect(componentInstance.value()).toBe(42);
    });

    it('tracks the pointer continuously while dragging', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 0 } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      fireEvent.pointerDown(dial, { clientX: 100, clientY: 0 });
      expect(componentInstance.value()).toBe(0);
      fireEvent.pointerMove(dial, { clientX: 200, clientY: 100 });
      expect(componentInstance.value()).toBe(25);
      fireEvent.pointerUp(dial);
      fireEvent.pointerMove(dial, { clientX: 100, clientY: 200 });

      // No longer dragging after pointerup — further moves are ignored.
      expect(componentInstance.value()).toBe(25);
    });

    it('ignores pointer input when disabled', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 0, disabled: true } },
      );
      mockDialRect(container, 0, 0, 200);
      const dial = within(container).getByRole('slider');

      fireEvent.pointerDown(dial, { clientX: 200, clientY: 100 });

      expect(componentInstance.value()).toBe(0);
    });
  });

  describe('wheel interaction', () => {
    it('increments by exactly one step per wheel event when focused', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      const dial = within(container).getByRole('slider');
      dial.focus();

      fireEvent.wheel(dial, { deltaY: -100 });

      expect(componentInstance.value()).toBe(51);
    });

    it('decrements by exactly one step per wheel event when focused', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      const dial = within(container).getByRole('slider');
      dial.focus();

      fireEvent.wheel(dial, { deltaY: 100 });

      expect(componentInstance.value()).toBe(49);
    });

    it('ignores wheel input when not focused', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      const dial = within(container).getByRole('slider');
      // Deliberately not focused.

      fireEvent.wheel(dial, { deltaY: -100 });

      expect(componentInstance.value()).toBe(50);
    });

    it('moves by exactly one step regardless of deltaY magnitude', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50 } },
      );
      const dial = within(container).getByRole('slider');
      dial.focus();

      fireEvent.wheel(dial, { deltaY: -5000 });

      expect(componentInstance.value()).toBe(51);
    });

    it('clamps at the max boundary via wheel', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 100 } },
      );
      const dial = within(container).getByRole('slider');
      dial.focus();

      fireEvent.wheel(dial, { deltaY: -100 });

      expect(componentInstance.value()).toBe(100);
    });

    it('ignores wheel input when disabled', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoKnob,
        { inputs: { value: 50, disabled: true } },
      );
      const dial = within(container).getByRole('slider');
      dial.focus();

      fireEvent.wheel(dial, { deltaY: -100 });

      expect(componentInstance.value()).toBe(50);
    });

    it('calls preventDefault only once focused (so page scroll is untouched while merely hovered)', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { value: 50 },
      });
      const dial = within(container).getByRole('slider');

      // fireEvent returns false when preventDefault() was called.
      expect(fireEvent.wheel(dial, { deltaY: -100 })).toBe(true);

      dial.focus();
      expect(fireEvent.wheel(dial, { deltaY: -100 })).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('sets aria-valuemin/aria-valuemax and falls back aria-label to "Knob" when unset', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { value: 30, min: 0, max: 100 },
      });

      const dial = within(container).getByRole('slider');
      expect(dial.getAttribute('aria-valuemin')).toBe('0');
      expect(dial.getAttribute('aria-valuemax')).toBe('100');
      expect(dial.getAttribute('aria-label')).toBe('Knob');
    });

    it('uses the provided ariaLabel when set', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { ariaLabel: 'Volume' },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-label'),
      ).toBe('Volume');
    });

    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(DynamoKnob);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations at a mid-range value', async () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { value: 55 },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('conditional rendering', () => {
    it('renders the center label by default', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { value: 42 },
      });
      expect(container.textContent).toContain('42');
    });

    it('omits the center label when showValue is false', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { value: 42, showValue: false },
      });
      expect(container.textContent).not.toContain('42');
    });
  });

  describe('edge cases', () => {
    it('does not throw or divide by zero when min equals max', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { min: 10, max: 10, value: 10 },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-valuenow'),
      ).toBe('10');
    });

    it('does not throw when step is zero or negative', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { value: 42, step: 0 },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-valuenow'),
      ).toBe('42');
    });

    it('does not throw or produce NaN geometry when strokeWidth exceeds diameter', () => {
      const { container } = renderDynamoComponent(DynamoKnob, {
        inputs: { diameter: 20, strokeWidth: 40 },
      });

      const circle = container.querySelector('circle');
      expect(circle?.getAttribute('r')).not.toBe('NaN');
    });
  });
});
