import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import type { DynamoSliderRange } from './slider.types';

@Component({
  selector: 'dg-slider-reactive-form-host',
  standalone: true,
  imports: [DynamoSlider, ReactiveFormsModule],
  template: `<dg-slider [formControl]="control" ariaLabel="Volume" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl(0, { nonNullable: true });
}

@Component({
  selector: 'dg-slider-reactive-range-form-host',
  standalone: true,
  imports: [DynamoSlider, ReactiveFormsModule],
  template: `<dg-slider
    [formControl]="control"
    [range]="true"
    ariaLabel="Price"
  />`,
})
class ReactiveRangeFormHostComponent {
  readonly control = new FormControl<DynamoSliderRange>(
    { minValue: 20, maxValue: 80 },
    { nonNullable: true },
  );
}

function mockTrackRect(
  container: HTMLElement,
  left: number,
  width: number,
): void {
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

function getThumb(container: HTMLElement, which: 'min' | 'max'): HTMLElement {
  const el = container.querySelector(`[data-thumb="${which}"]`);
  if (!el) throw new Error(`thumb not found: ${which}`);
  return el as HTMLElement;
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

  describe('readOnly', () => {
    it('blocks keyboard and pointer interaction, but keeps the thumb focusable', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        { inputs: { value: 50, readOnly: true } },
      );
      mockTrackRect(container, 0, 200);
      const thumb = within(container).getByRole('slider') as HTMLElement;
      thumb.focus();

      fireEvent.keyDown(thumb, { key: 'ArrowRight' });
      fireEvent.pointerDown(thumb.parentElement as HTMLElement, {
        clientX: 190,
      });

      expect(componentInstance.value()).toBe(50);
      expect(thumb.tabIndex).toBe(0);
      expect(thumb.getAttribute('aria-readonly')).toBe('true');
    });
  });

  describe('ControlValueAccessor / forms integration', () => {
    it('propagates a keyboard change to a bound reactive FormControl', () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const thumb = within(container).getByRole('slider') as HTMLElement;
      thumb.focus();

      fireEvent.keyDown(thumb, { key: 'ArrowRight' });

      expect(componentInstance.control.value).toBe(1);
    });

    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue(42);
      fixture.detectChanges();

      expect(
        within(container).getByRole('slider').getAttribute('aria-valuenow'),
      ).toBe('42');
    });

    it('setDisabledState reflects onto the disabled model', () => {
      const { componentInstance } = renderDynamoComponent(DynamoSlider);

      componentInstance.setDisabledState(true);

      expect(componentInstance.disabled()).toBe(true);
    });

    it('marks the FormControl as touched after a drag ends', () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      mockTrackRect(container, 0, 200);
      const thumb = within(container).getByRole('slider') as HTMLElement;
      expect(componentInstance.control.touched).toBe(false);

      fireEvent.pointerDown(thumb.parentElement as HTMLElement, {
        clientX: 100,
      });
      fireEvent.pointerUp(thumb.parentElement as HTMLElement);

      expect(componentInstance.control.touched).toBe(true);
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

  describe('range', () => {
    it('renders exactly one slider when range is unset (regression)', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: { value: 50 },
      });

      expect(within(container).getAllByRole('slider')).toHaveLength(1);
    });

    it('renders exactly two sliders when range is true', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: {
          range: true,
          value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
        },
      });

      expect(within(container).getAllByRole('slider')).toHaveLength(2);
    });

    it('reflects an explicit DynamoSliderRange value on both thumbs', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: {
          range: true,
          value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
        },
      });

      expect(getThumb(container, 'min').getAttribute('aria-valuenow')).toBe(
        '20',
      );
      expect(getThumb(container, 'max').getAttribute('aria-valuenow')).toBe(
        '80',
      );
    });

    it('clamps the min-thumb so it never exceeds the max-thumb (keyboard)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        {
          inputs: {
            range: true,
            value: { minValue: 20, maxValue: 25 } as DynamoSliderRange,
          },
        },
      );
      getThumb(container, 'min').focus();

      // step 1, x10 pushes to 30, well past maxValue (25) — should clamp to 25.
      await userEvent.keyboard('{PageUp}');

      expect(componentInstance.value()).toEqual({ minValue: 25, maxValue: 25 });
    });

    it('clamps the max-thumb so it never drops below the min-thumb (keyboard)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        {
          inputs: {
            range: true,
            value: { minValue: 75, maxValue: 80 } as DynamoSliderRange,
          },
        },
      );
      getThumb(container, 'max').focus();

      await userEvent.keyboard('{PageDown}');

      expect(componentInstance.value()).toEqual({ minValue: 75, maxValue: 75 });
    });

    it('moves each thumb independently via keyboard', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        {
          inputs: {
            range: true,
            value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
          },
        },
      );

      getThumb(container, 'min').focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.value()).toEqual({ minValue: 21, maxValue: 80 });

      getThumb(container, 'max').focus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(componentInstance.value()).toEqual({ minValue: 21, maxValue: 79 });
    });

    it('ignores keyboard input on either thumb when disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        {
          inputs: {
            range: true,
            value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
            disabled: true,
          },
        },
      );

      getThumb(container, 'min').focus();
      await userEvent.keyboard('{ArrowRight}');
      getThumb(container, 'max').focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(componentInstance.value()).toEqual({ minValue: 20, maxValue: 80 });
    });

    it('drags each thumb independently via pointer, never affecting the other', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        {
          inputs: {
            range: true,
            value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
          },
        },
      );
      mockTrackRect(container, 0, 200);
      const track = getThumb(container, 'min').parentElement as HTMLElement;

      fireEvent.pointerDown(getThumb(container, 'min'), { clientX: 0 });
      fireEvent.pointerMove(track, { clientX: 10 });
      expect(componentInstance.value()).toEqual({ minValue: 5, maxValue: 80 });
      fireEvent.pointerUp(track);

      fireEvent.pointerDown(getThumb(container, 'max'), { clientX: 0 });
      fireEvent.pointerMove(track, { clientX: 190 });
      expect(componentInstance.value()).toEqual({ minValue: 5, maxValue: 95 });
    });

    it('does not jump on a bare track click in range mode (track-click-to-jump is non-range only)', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSlider,
        {
          inputs: {
            range: true,
            value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
          },
        },
      );
      mockTrackRect(container, 0, 200);
      const track = getThumb(container, 'min').parentElement as HTMLElement;

      fireEvent.pointerDown(track, { clientX: 100 });

      expect(componentInstance.value()).toEqual({ minValue: 20, maxValue: 80 });
    });

    it("each thumb's aria-valuemin/aria-valuemax reflects its own movable range, not the slider's overall bounds", async () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: {
          range: true,
          min: 0,
          max: 100,
          value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
        },
      });

      const minThumb = getThumb(container, 'min');
      const maxThumb = getThumb(container, 'max');
      expect(minThumb.getAttribute('aria-valuemin')).toBe('0');
      expect(minThumb.getAttribute('aria-valuemax')).toBe('80');
      expect(maxThumb.getAttribute('aria-valuemin')).toBe('20');
      expect(maxThumb.getAttribute('aria-valuemax')).toBe('100');

      // Move the max-thumb down — the min-thumb's own aria-valuemax should
      // track it live, not stay pinned to the slider's overall max().
      maxThumb.focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(getThumb(container, 'min').getAttribute('aria-valuemax')).toBe(
        '79',
      );
    });

    it('gives each thumb a distinct aria-label derived from ariaLabel', () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: {
          range: true,
          ariaLabel: 'Price',
          value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
        },
      });

      expect(getThumb(container, 'min').getAttribute('aria-label')).toBe(
        'Price minimum',
      );
      expect(getThumb(container, 'max').getAttribute('aria-label')).toBe(
        'Price maximum',
      );
    });

    it('propagates a keyboard change to a bound reactive FormControl<DynamoSliderRange>', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveRangeFormHostComponent,
      );
      getThumb(container, 'min').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(componentInstance.control.value).toEqual({
        minValue: 21,
        maxValue: 80,
      });
    });

    it('reflects an externally-set FormControl<DynamoSliderRange> value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveRangeFormHostComponent,
      );

      componentInstance.control.setValue({ minValue: 30, maxValue: 70 });
      fixture.detectChanges();

      expect(getThumb(container, 'min').getAttribute('aria-valuenow')).toBe(
        '30',
      );
      expect(getThumb(container, 'max').getAttribute('aria-valuenow')).toBe(
        '70',
      );
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoSlider, {
        inputs: {
          range: true,
          value: { minValue: 20, maxValue: 80 } as DynamoSliderRange,
          ariaLabel: 'Price',
        },
      });

      await expectNoA11yViolations(container);
    });
  });
});
