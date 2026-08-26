import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoSlider } from './slider';
import { DynamoSliderHarness } from './slider.harness';

function mockTrackRect(container: HTMLElement, left: number, width: number): void {
  const track = container.querySelector('[role="slider"]')
    ?.parentElement as HTMLElement;
  track.getBoundingClientRect = () =>
    ({
      left,
      width,
      top: 0,
      height: 0,
      right: left + width,
      bottom: 0,
      x: left,
      y: 0,
      toJSON: () => '',
    }) as DOMRect;
}

describe('DynamoSlider', () => {
  describe('creation', () => {
    it('renders a role="slider" element', () => {
      const { container } = renderDynamoComponent(DynamoSlider);

      expect(within(container).getByRole('slider')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults value to 0, min to 0, max to 100, and step to 1', () => {
      const { componentInstance } = renderDynamoComponent(DynamoSlider);

      expect(componentInstance.value()).toBe(0);
      expect(componentInstance.min()).toBe(0);
      expect(componentInstance.max()).toBe(100);
      expect(componentInstance.step()).toBe(1);
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
        const { container } = renderDynamoComponent(DynamoSlider, {
          inputs: { value },
        });

        expect(
          within(container).getByRole('slider').getAttribute('aria-valuenow'),
        ).toBe(String(expected));
      },
    );

    it('snaps a non-step-aligned value to the nearest step', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
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
        DynamoSlider,
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
        DynamoSlider,
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
        DynamoSlider,
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
        DynamoSlider,
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
        DynamoSlider,
        { inputs: { value: 99, step: 5 } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toBe(100);
    });

    it('ignores keyboard input when disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        { inputs: { value: 50, disabled: true } },
      );
      within(container).getByRole('slider').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toBe(50);
    });

    it('supports interaction through the DynamoSliderHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        { inputs: { value: 50 } },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSliderHarness,
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
    // jsdom has no layout engine (getBoundingClientRect returns all zeros)
    // and no setPointerCapture — same category of limitation as Carousel's
    // pointer-drag tests, fixed the same way: mock getBoundingClientRect.
    it('jumps to the clicked position on the track', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        { inputs: { value: 0 } },
      );
      mockTrackRect(container, 0, 200);
      const track = container.querySelector('[role="slider"]')
        ?.parentElement as HTMLElement;

      fireEvent.pointerDown(track, { clientX: 150 });

      expect(componentInstance.value()).toBe(75);
    });

    it('tracks the pointer continuously while dragging', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        { inputs: { value: 0 } },
      );
      mockTrackRect(container, 0, 200);
      const track = container.querySelector('[role="slider"]')
        ?.parentElement as HTMLElement;

      fireEvent.pointerDown(track, { clientX: 0 });
      expect(componentInstance.value()).toBe(0);
      fireEvent.pointerMove(track, { clientX: 100 });
      expect(componentInstance.value()).toBe(50);
      fireEvent.pointerUp(track);
      fireEvent.pointerMove(track, { clientX: 200 });

      // No longer dragging after pointerup — further moves are ignored.
      expect(componentInstance.value()).toBe(50);
    });

    it('ignores pointer input when disabled', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        { inputs: { value: 0, disabled: true } },
      );
      mockTrackRect(container, 0, 200);
      const track = container.querySelector('[role="slider"]')
        ?.parentElement as HTMLElement;

      fireEvent.pointerDown(track, { clientX: 150 });

      expect(componentInstance.value()).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('sets aria-valuemin/aria-valuemax and falls back aria-label to "Slider" when unset', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: { value: 30, min: 0, max: 100 },
      });

      const slider = within(container).getByRole('slider');
      expect(slider.getAttribute('aria-valuemin')).toBe('0');
      expect(slider.getAttribute('aria-valuemax')).toBe('100');
      expect(slider.getAttribute('aria-label')).toBe('Slider');
    });

    it('uses the provided ariaLabel when set', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: { ariaLabel: 'Volume' },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-label'),
      ).toBe('Volume');
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: { value: 55 },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('does not throw or divide by zero when min equals max', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: { min: 10, max: 10, value: 10 },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-valuenow'),
      ).toBe('10');
    });

    it('does not throw when step is zero or negative', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: { value: 42, step: 0 },
      });

      expect(
        within(container).getByRole('slider').getAttribute('aria-valuenow'),
      ).toBe('42');
    });
  });
});
