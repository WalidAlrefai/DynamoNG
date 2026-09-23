import { Component, model } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoColorPicker } from './color-picker';
import { DynamoColorPickerHarness } from './color-picker.harness';

// The CDK overlay portals the panel content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container`
// element — same reasoning as DynamoSelect's/DynamoAutocomplete's specs.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('.cdk-overlay-pane');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

function getSwatches(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('button[aria-pressed]'));
}

function getNativeColorInput(): HTMLInputElement {
  return document.body.querySelector('input[type="color"]') as HTMLInputElement;
}

function getAlphaSlider(): HTMLInputElement | null {
  return document.body.querySelector<HTMLInputElement>('input[type="range"]');
}

function getHueSlider(): HTMLInputElement | null {
  return document.body.querySelector<HTMLInputElement>(
    'input[aria-label="Hue"]',
  );
}

function getSvSquare(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(
    '[aria-label="Saturation and brightness"]',
  );
}

// jsdom has no layout engine (getBoundingClientRect returns all zeros) —
// mock it to a fixed rect so pointer-drag math is testable, same technique
// as DynamoSlider's own `mockTrackRect`, extended to 2D (top/height too).
function mockSvSquareRect(
  el: HTMLElement,
  width: number,
  height: number,
): void {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width,
      height,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => '',
    }) as DOMRect;
}

// The isOpen()-driven overlay attach/detach effect runs via Angular's
// zoneless effect scheduler, not synchronously with the signal write that
// triggered it — flushing a real setTimeout(0) plus detectChanges() is
// needed before asserting on the result, same technique as DynamoSelect's/
// DynamoAutocomplete's specs.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-color-picker-test-host',
  standalone: true,
  imports: [DynamoColorPicker],
  template: `<dg-color-picker [(value)]="value" ariaLabel="Color" />`,
})
class ColorPickerTestHostComponent {
  readonly value = model('');
}

@Component({
  selector: 'dg-color-picker-reactive-form-host',
  standalone: true,
  imports: [DynamoColorPicker, ReactiveFormsModule],
  template: `<dg-color-picker [formControl]="control" ariaLabel="Color" />`,
})
class ColorPickerReactiveFormHostComponent {
  readonly control = new FormControl('#ff0000');
}

@Component({
  selector: 'dg-color-picker-reactive-form-alpha-host',
  standalone: true,
  imports: [DynamoColorPicker, ReactiveFormsModule],
  template: `<dg-color-picker
    [formControl]="control"
    [showAlpha]="true"
    ariaLabel="Color"
  />`,
})
class ColorPickerReactiveFormAlphaHostComponent {
  readonly control = new FormControl('#ff0000');
}

describe('DynamoColorPicker', () => {
  describe('creation', () => {
    it('renders a hex text field and a swatch-preview trigger', () => {
      const { container } = renderDynamoComponent(DynamoColorPicker);

      expect(container.querySelector('input[type="text"]')).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: /Choose color/ }),
      ).toBeTruthy();
    });

    it('does not render the panel until opened', () => {
      renderDynamoComponent(DynamoColorPicker);

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to an empty value, closed, and size "md"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoColorPicker);

      expect(componentInstance.value()).toBe('');
      expect(componentInstance.size()).toBe('md');
    });

    it('renders the default swatch palette', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker);
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getSwatches()).toHaveLength(10);
    });
  });

  describe('hex field', () => {
    it('updates value as text is typed, without validating it', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const field = container.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;

      await userEvent.type(field, 'not-a-real-color');
      await settle(fixture);

      expect(componentInstance.value()).toBe('not-a-real-color');
    });
  });

  describe('swatch selection', () => {
    it('sets the value, closes, and refocuses the trigger when a swatch is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getSwatches()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.value()).toBe('#ef4444');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('marks only the currently matching swatch as aria-pressed', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { value: '#22c55e' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const pressed = getSwatches().filter(
        (swatch) => swatch.getAttribute('aria-pressed') === 'true',
      );
      expect(pressed).toHaveLength(1);
      expect(pressed[0]?.getAttribute('aria-label')).toBe('Color #22c55e');
    });
  });

  describe('native color input', () => {
    it('sets the value, closes, and refocuses the trigger when a color is picked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const nativeInput = getNativeColorInput();
      nativeInput.value = '#123456';
      fireEvent.input(nativeInput);
      await settle(fixture);

      expect(componentInstance.value()).toBe('#123456');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('falls back to #000000 for the native input when value is not a valid 6-digit hex', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { value: 'not-a-color' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getNativeColorInput().value).toBe('#000000');
    });
  });

  describe('keyboard', () => {
    it('closes when the trigger is clicked again while open (toggle)', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('closes on Escape from a swatch button that has received focus inside the panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);
      getSwatches()[0]?.focus();

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('closes and refocuses the trigger on Escape', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('supports interaction through the DynamoColorPickerHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoColorPickerHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.open();
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getSwatchColors()).toContain('Color #3b82f6');

      await harness.selectSwatchByColor('#3b82f6');
      expect(componentInstance.value()).toBe('#3b82f6');

      await harness.open();
      expect(await harness.isOpen()).toBe(true);
      await harness.close();
      expect(await harness.isOpen()).toBe(false);

      await harness.typeHex('#abcdef');
      expect(componentInstance.value()).toBe('#abcdef');

      await expect(
        harness.selectSwatchByColor('#nonexistent'),
      ).rejects.toThrow();
    });
  });

  describe('inline', () => {
    it('defaults to false, rendering a trigger button and no swatch grid until opened', () => {
      const { container } = renderDynamoComponent(ColorPickerTestHostComponent);

      expect(container.querySelector('button[aria-haspopup]')).not.toBeNull();
      expect(getSwatches()).toHaveLength(0);
    });

    it('renders the swatch grid and native color input directly, with no trigger button', () => {
      const { container } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { inline: true },
      });

      expect(container.querySelector('button[aria-haspopup]')).toBeNull();
      expect(getSwatches().length).toBeGreaterThan(0);
      expect(getNativeColorInput()).not.toBeNull();
    });

    it('still renders the hex text input alongside the inline grid', () => {
      const { container } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { inline: true },
      });

      expect(container.querySelector('input[type="text"]')).not.toBeNull();
    });

    it('commits a swatch click directly, without needing to open/close an overlay', () => {
      const { componentInstance } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { inline: true, swatches: ['#ef4444'] },
      });
      const swatch = getSwatches()[0] as HTMLButtonElement;

      swatch.click();

      expect(componentInstance.value().toLowerCase()).toBe('#ef4444');
    });

    it('has no axe violations while inline', async () => {
      const { container } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { inline: true, ariaLabel: 'Color' },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('disabled', () => {
    it('disables the hex field and blocks opening the panel', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { disabled: true },
      });
      const field = container.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });

      expect(field.disabled).toBe(true);
      expect(trigger.hasAttribute('disabled')).toBe(true);

      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });
  });

  describe('Angular forms integration', () => {
    it('reflects the initial FormControl value (writeValue)', () => {
      const { container } = renderDynamoComponent(
        ColorPickerReactiveFormHostComponent,
      );
      const field = container.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;

      expect(field.value).toBe('#ff0000');
    });

    it('propagates a swatch pick back to the FormControl (registerOnChange)', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerReactiveFormHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getSwatches()[0] as HTMLElement);
      await settle(fixture);

      expect(fixture.componentInstance.control.value).toBe('#ef4444');
    });

    it('disables the field when the FormControl is disabled (setDisabledState)', () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerReactiveFormHostComponent,
      );
      fixture.componentInstance.control.disable();
      fixture.detectChanges();

      const field = container.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;
      expect(field.disabled).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('sets aria-haspopup="dialog" and toggles aria-expanded, with no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      await userEvent.click(trigger);
      await settle(fixture);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('alpha', () => {
    it('defaults to false, rendering no alpha slider even with the panel open', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getAlphaSlider()).toBeNull();
    });

    it('renders the alpha slider defaulting to 100% for an empty value', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { showAlpha: true },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const slider = getAlphaSlider();
      expect(slider).not.toBeNull();
      expect(Number(slider?.value)).toBe(1);
      expect(getPanel()?.textContent).toContain('100%');
    });

    it('initializes the slider from an 8-digit hex value', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { showAlpha: true, value: '#3b82f6cc' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const slider = getAlphaSlider();
      expect(Number(slider?.value)).toBeCloseTo(0.8, 2);
      expect(getPanel()?.textContent).toContain('80%');
    });

    it('dragging the slider writes an 8-digit hex back into value, preserving the RGB', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { showAlpha: true, value: '#3b82f6' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const slider = getAlphaSlider() as HTMLInputElement;
      slider.value = '0.5';
      fireEvent.input(slider);
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#3b82f680');
    });

    it('dragging back to 1 collapses value to a plain 6-digit hex', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { showAlpha: true, value: '#3b82f680' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const slider = getAlphaSlider() as HTMLInputElement;
      slider.value = '1';
      fireEvent.input(slider);
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#3b82f6');
    });

    it('does not close the panel when the alpha slider is dragged', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { showAlpha: true, value: '#3b82f6' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const slider = getAlphaSlider() as HTMLInputElement;
      slider.value = '0.5';
      fireEvent.input(slider);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('propagates an alpha change to a bound reactive FormControl', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerReactiveFormAlphaHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const slider = getAlphaSlider() as HTMLInputElement;
      slider.value = '0.5';
      fireEvent.input(slider);
      await settle(fixture);

      expect(fixture.componentInstance.control.value?.toLowerCase()).toBe(
        '#ff000080',
      );
    });

    it('preserves the current alpha when a swatch is picked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { showAlpha: true, value: '#00000080' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getSwatches()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#ef444480');
    });

    it('preserves the current alpha when a color is picked via the native input', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { showAlpha: true, value: '#00000080' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const nativeInput = getNativeColorInput();
      nativeInput.value = '#123456';
      fireEvent.input(nativeInput);
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#12345680');
    });

    it('keeps a swatch marked aria-pressed after only alpha changes', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { showAlpha: true, value: '#22c55e' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const slider = getAlphaSlider() as HTMLInputElement;
      slider.value = '0.5';
      fireEvent.input(slider);
      await settle(fixture);

      const pressed = getSwatches().filter(
        (swatch) => swatch.getAttribute('aria-pressed') === 'true',
      );
      expect(pressed).toHaveLength(1);
      expect(pressed[0]?.getAttribute('aria-label')).toBe('Color #22c55e');
    });

    it('strips the alpha suffix when feeding the native color input', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { showAlpha: true, value: '#3b82f680' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getNativeColorInput().value.toLowerCase()).toBe('#3b82f6');
    });

    // jsdom's CSSOM doesn't reliably round-trip CSS functions like
    // repeating-conic-gradient() through element.style, so these check the
    // underlying computed signal directly rather than rendered inline-style
    // text.
    it('computes a trigger preview gradient when showAlpha is on and a value is set', () => {
      const { componentInstance } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { showAlpha: true, value: '#3b82f680' },
      });
      expect(componentInstance['triggerPreviewBackground']()).toContain(
        'linear-gradient',
      );
    });

    it('computes no trigger preview gradient when showAlpha is off', () => {
      const { componentInstance } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { value: '#3b82f6' },
      });
      expect(componentInstance['triggerPreviewBackground']()).toBeNull();
    });

    it('supports getAlpha/setAlpha through the DynamoColorPickerHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { showAlpha: true, value: '#3b82f6' } },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoColorPickerHarness,
      );

      expect(await harness.getAlpha()).toBeNull();

      await harness.open();
      expect(await harness.getAlpha()).toBe(1);

      await harness.setAlpha(0.5);
      expect(componentInstance.value().toLowerCase()).toBe('#3b82f680');
      // Lossy round-trip by design — alpha is stored as a 2-hex-digit
      // (256-level) channel, not the slider's own 101-level (step 0.01)
      // precision, same as any 8-bit color channel.
      expect(await harness.getAlpha()).toBeCloseTo(0.5, 2);
    });

    it('has no axe violations with the alpha slider shown', async () => {
      const { container } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { showAlpha: true, ariaLabel: 'Color' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('customPicker', () => {
    it('defaults to false, rendering the native input and no SV square/hue slider', async () => {
      const { container, fixture } = renderDynamoComponent(
        ColorPickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getNativeColorInput()).not.toBeNull();
      expect(getSvSquare()).toBeNull();
      expect(getHueSlider()).toBeNull();
    });

    it('renders the SV square and hue slider, and no native color input, when true', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { customPicker: true },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getSvSquare()).not.toBeNull();
      expect(getHueSlider()).not.toBeNull();
      expect(getNativeColorInput()).toBeNull();
    });

    it('dragging to the top-right corner of the SV square (from white) sets pure hue-0 red', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ffffff' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const square = getSvSquare() as HTMLElement;
      mockSvSquareRect(square, 200, 200);

      fireEvent.pointerDown(square, { clientX: 200, clientY: 0 });
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#ff0000');
    });

    it('tracks the pointer continuously while dragging, and stops on pointerup', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ff0000' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const square = getSvSquare() as HTMLElement;
      mockSvSquareRect(square, 200, 200);

      fireEvent.pointerDown(square, { clientX: 200, clientY: 0 });
      await settle(fixture);
      fireEvent.pointerMove(square, { clientX: 0, clientY: 200 });
      await settle(fixture);
      expect(componentInstance.value().toLowerCase()).toBe('#000000');

      fireEvent.pointerUp(square);
      fireEvent.pointerMove(square, { clientX: 200, clientY: 0 });
      await settle(fixture);

      // No longer dragging after pointerup — further moves are ignored.
      expect(componentInstance.value().toLowerCase()).toBe('#000000');
    });

    it('the hue slider changes hue while preserving the current saturation/brightness', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ff0000' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const hueSlider = getHueSlider() as HTMLInputElement;
      hueSlider.value = '120';
      fireEvent.input(hueSlider);
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#00ff00');
    });

    it('does not close the panel on SV-square or hue-slider interaction', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { customPicker: true, value: '#ff0000' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const square = getSvSquare() as HTMLElement;
      mockSvSquareRect(square, 200, 200);
      fireEvent.pointerDown(square, { clientX: 100, clientY: 100 });
      await settle(fixture);

      const hueSlider = getHueSlider() as HTMLInputElement;
      hueSlider.value = '200';
      fireEvent.input(hueSlider);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('arrow keys on the focused SV square nudge saturation/brightness', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ffffff' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const square = getSvSquare() as HTMLElement;
      square.focus();
      const before = componentInstance['hsv']();
      expect(before.s).toBe(0);

      fireEvent.keyDown(square, { key: 'ArrowRight' });
      await settle(fixture);

      const after = componentInstance['hsv']();
      // Lossy round-trip by design — s/v are re-derived from the encoded
      // 8-bit-per-channel hex, same as alpha's own 256-level precision.
      expect(after.s).toBeCloseTo(0.02, 2);
      expect(after.v).toBe(before.v);
    });

    it('ArrowLeft/ArrowDown nudge saturation/brightness downward; Shift widens the step', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ff0000' } }, // s=1, v=1
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const square = getSvSquare() as HTMLElement;
      square.focus();

      fireEvent.keyDown(square, { key: 'ArrowDown', shiftKey: true });
      await settle(fixture);
      expect(componentInstance['hsv']().v).toBeCloseTo(0.8, 2);

      fireEvent.keyDown(square, { key: 'ArrowLeft' });
      await settle(fixture);
      expect(componentInstance['hsv']().s).toBeCloseTo(0.98, 2);
    });

    it('ignores keys other than the four arrows on the SV square', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ffffff' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const square = getSvSquare() as HTMLElement;
      square.focus();
      const before = componentInstance.value();

      fireEvent.keyDown(square, { key: 'a' });
      await settle(fixture);

      expect(componentInstance.value()).toBe(before);
    });

    it('moves the SV thumb and hue slider to match a swatch pick (reactive sync)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ffffff' } },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getSwatches()[0] as HTMLElement);
      await settle(fixture);
      // selectSwatch closes the panel — reopen to inspect the panel's state.
      await userEvent.click(trigger);
      await settle(fixture);

      const hsv = componentInstance['hsv']();
      expect(Number(getHueSlider()?.value)).toBeCloseTo(hsv.h, 5);

      const thumb = getSvSquare()?.querySelector('div') as HTMLElement;
      expect(parseFloat(thumb.style.left)).toBeCloseTo(hsv.s * 100, 5);
      expect(parseFloat(thumb.style.top)).toBeCloseTo((1 - hsv.v) * 100, 5);
    });

    it('preserves the current alpha when dragging the SV square', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        {
          inputs: {
            customPicker: true,
            showAlpha: true,
            value: '#00000080',
          },
        },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const square = getSvSquare() as HTMLElement;
      mockSvSquareRect(square, 200, 200);
      fireEvent.pointerDown(square, { clientX: 200, clientY: 0 });
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#ff000080');
    });

    it('preserves the current alpha when changing the hue slider', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        {
          inputs: {
            customPicker: true,
            showAlpha: true,
            value: '#ff000080',
          },
        },
      );
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const hueSlider = getHueSlider() as HTMLInputElement;
      hueSlider.value = '120';
      fireEvent.input(hueSlider);
      await settle(fixture);

      expect(componentInstance.value().toLowerCase()).toBe('#00ff0080');
    });

    it.each([
      { hue: '270', expected: '#8000ff' },
      { hue: '330', expected: '#ff0080' },
    ])(
      'sets hue=$hue to $expected (covers the 240-300 and 300-360 hue-wheel segments)',
      async ({ hue, expected }) => {
        const { container, fixture, componentInstance } =
          renderDynamoComponent(DynamoColorPicker, {
            inputs: { customPicker: true, value: '#ff0000' },
          });
        const trigger = within(container).getByRole('button', {
          name: /Choose color/,
        });
        await userEvent.click(trigger);
        await settle(fixture);

        const hueSlider = getHueSlider() as HTMLInputElement;
        hueSlider.value = hue;
        fireEvent.input(hueSlider);
        await settle(fixture);

        expect(componentInstance.value().toLowerCase()).toBe(expected);
      },
    );

    it('supports getHue/setHue and nudgeSaturation/nudgeBrightness through the DynamoColorPickerHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { customPicker: true, value: '#ff0000' } },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoColorPickerHarness,
      );

      expect(await harness.getHue()).toBeNull();

      await harness.open();
      expect(await harness.getHue()).toBe(0);

      await harness.setHue(120);
      expect(componentInstance.value().toLowerCase()).toBe('#00ff00');

      await harness.nudgeSaturation('decrease');
      expect(componentInstance['hsv']().s).toBeCloseTo(0.98, 2);

      await harness.nudgeBrightness('decrease');
      expect(componentInstance['hsv']().v).toBeCloseTo(0.98, 2);
      await harness.nudgeBrightness('increase');
      await harness.nudgeSaturation('increase');
    });

    it('throws from setHue/nudgeSaturation/nudgeBrightness when customPicker is off', async () => {
      const { fixture } = renderDynamoComponent(ColorPickerTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoColorPickerHarness,
      );
      await harness.open();

      await expect(harness.setHue(120)).rejects.toThrow();
      await expect(harness.nudgeSaturation('increase')).rejects.toThrow();
      await expect(harness.nudgeBrightness('increase')).rejects.toThrow();
    });

    it('has no axe violations with the SV square and hue slider shown', async () => {
      const { container } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { customPicker: true, ariaLabel: 'Color' },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });
      await userEvent.click(trigger);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('renders a panel with only the native color input when swatches is empty', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoColorPicker, {
        inputs: { swatches: [] },
      });
      const trigger = within(container).getByRole('button', {
        name: /Choose color/,
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getSwatches()).toHaveLength(0);
      expect(getNativeColorInput()).toBeTruthy();
    });
  });
});
