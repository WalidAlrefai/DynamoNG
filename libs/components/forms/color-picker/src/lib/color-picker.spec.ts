import { Component, model } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
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
  return Array.from(
    document.body.querySelectorAll('button[aria-pressed]'),
  );
}

function getNativeColorInput(): HTMLInputElement {
  return document.body.querySelector(
    'input[type="color"]',
  ) as HTMLInputElement;
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

describe('DynamoColorPicker', () => {
  describe('creation', () => {
    it('renders a hex text field and a swatch-preview trigger', () => {
      const { container } = renderDynamoComponent(DynamoColorPicker);

      expect(
        container.querySelector('input[type="text"]'),
      ).toBeTruthy();
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
      const { container, fixture } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { value: '#22c55e' } },
      );
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
      const { container, fixture } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { value: 'not-a-color' } },
      );
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

  describe('edge cases', () => {
    it('renders a panel with only the native color input when swatches is empty', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoColorPicker,
        { inputs: { swatches: [] } },
      );
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
