import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
  type RenderDynamoComponentOptions,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoInputNumber } from './input-number';
import { DynamoInputNumberHarness } from './input-number.harness';

@Component({
  selector: 'dg-input-number-reactive-form-host',
  standalone: true,
  imports: [DynamoInputNumber, ReactiveFormsModule],
  template: `<dg-input-number [formControl]="control" ariaLabel="Quantity" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl<number | null>(null);
}

@Component({
  selector: 'dg-input-number-ng-model-host',
  standalone: true,
  imports: [DynamoInputNumber, FormsModule],
  template: `<dg-input-number [(ngModel)]="value" ariaLabel="Quantity" />`,
})
class NgModelHostComponent {
  value: number | null = null;
}

// `value` is CVA-only (matching InputText's precedent), not a bindable
// `input()`/`model()` — so an initial value can't go through
// `renderDynamoComponent`'s `inputs` option and must be set via
// `writeValue()` after render instead.
function renderWithValue(
  value: number,
  options: RenderDynamoComponentOptions<DynamoInputNumber> = {},
) {
  const result = renderDynamoComponent(DynamoInputNumber, {
    ...options,
    inputs: { ariaLabel: 'Quantity', ...options.inputs },
  });
  result.componentInstance.writeValue(value);
  result.fixture.detectChanges();
  return result;
}

describe('DynamoInputNumber', () => {
  describe('creation', () => {
    it('renders a role="spinbutton" input', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });

      expect(within(container).getByRole('spinbutton')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to an empty display, not disabled, no aria-valuenow', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });

      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;
      expect(input.value).toBe('');
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-valuenow')).toBeNull();
      expect(input.getAttribute('aria-valuemin')).toBeNull();
      expect(input.getAttribute('aria-valuemax')).toBeNull();
    });
  });

  describe('input properties', () => {
    it('reflects the placeholder input', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { placeholder: '0', ariaLabel: 'Quantity' },
      });

      expect(within(container).getByPlaceholderText('0')).toBeTruthy();
    });

    it('reflects the disabled input onto the native element and both buttons', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { disabled: true, ariaLabel: 'Quantity' },
      });

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement)
          .disabled,
      ).toBe(true);
      expect(
        (within(container).getByLabelText('Increment') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect(
        (within(container).getByLabelText('Decrement') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });

    it('reflects min/max as aria-valuemin/aria-valuemax once a value is set', () => {
      const { container } = renderWithValue(5, {
        inputs: { min: 0, max: 10 },
      });

      const input = within(container).getByRole('spinbutton');
      expect(input.getAttribute('aria-valuemin')).toBe('0');
      expect(input.getAttribute('aria-valuemax')).toBe('10');
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoInputNumber,
        { inputs: { ariaLabel: 'Quantity' } },
      );

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    it('propagates a typed-then-blurred value to a bound reactive FormControl', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      await userEvent.type(within(container).getByRole('spinbutton'), '42');
      await userEvent.tab();

      expect(componentInstance.control.value).toBe(42);
    });

    it('propagates a typed-then-blurred value to an [(ngModel)] binding', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(NgModelHostComponent);

      await userEvent.type(within(container).getByRole('spinbutton'), '7');
      await userEvent.tab();

      expect(componentInstance.value).toBe(7);
    });
  });

  describe('user interactions', () => {
    it('commits a typed value on blur', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;

      await userEvent.type(input, '15');
      expect(input.value).toBe('15');
      await userEvent.tab();

      expect(input.value).toBe('15');
    });

    it('preserves partial text (a lone "-") while focused instead of clamping mid-type', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;

      await userEvent.type(input, '-');

      expect(input.value).toBe('-');
    });

    it('reverts to the last committed value when blurred with unparseable text', async () => {
      const { container } = renderWithValue(5);
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;

      await userEvent.clear(input);
      await userEvent.type(input, 'abc');
      await userEvent.tab();

      expect(input.value).toBe('5');
    });

    it('commits null when blurred with an empty field', async () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      componentInstance.control.setValue(5);
      fixture.detectChanges();
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;

      await userEvent.clear(input);
      await userEvent.tab();

      expect(componentInstance.control.value).toBeNull();
    });

    it('increments and decrements by step via the +/- buttons', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      componentInstance.control.setValue(10);

      await userEvent.click(within(container).getByLabelText('Increment'));
      expect(componentInstance.control.value).toBe(11);

      await userEvent.click(within(container).getByLabelText('Decrement'));
      await userEvent.click(within(container).getByLabelText('Decrement'));
      expect(componentInstance.control.value).toBe(9);
    });

    it('disables the increment/decrement buttons at min/max', async () => {
      const { container } = renderWithValue(2, { inputs: { min: 0, max: 2 } });

      expect(
        (within(container).getByLabelText('Increment') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect(
        (within(container).getByLabelText('Decrement') as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });

    it('steps by step*10 with PageUp/PageDown, and jumps to min/max with Home/End', async () => {
      const { container } = renderWithValue(50, {
        inputs: { min: 0, max: 100, step: 2 },
      });
      const input = within(container).getByRole('spinbutton');
      input.focus();

      await userEvent.keyboard('{PageUp}');
      expect((input as HTMLInputElement).value).toBe('70');

      await userEvent.keyboard('{PageDown}');
      await userEvent.keyboard('{PageDown}');
      expect((input as HTMLInputElement).value).toBe('30');

      await userEvent.keyboard('{Home}');
      expect((input as HTMLInputElement).value).toBe('0');

      await userEvent.keyboard('{End}');
      expect((input as HTMLInputElement).value).toBe('100');
    });

    it('steps by step with ArrowUp/ArrowDown', async () => {
      const { container } = renderWithValue(5);
      const input = within(container).getByRole('spinbutton');
      input.focus();

      await userEvent.keyboard('{ArrowUp}');
      expect((input as HTMLInputElement).value).toBe('6');

      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      expect((input as HTMLInputElement).value).toBe('4');
    });

    it('ignores Home/End when min/max are not set', async () => {
      const { container } = renderWithValue(5);
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;
      input.focus();

      await userEvent.keyboard('{Home}');

      expect(input.value).toBe('5');
    });

    it('ignores all interaction when disabled', async () => {
      const { container } = renderWithValue(5, { inputs: { disabled: true } });
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;
      input.focus();

      await userEvent.keyboard('{ArrowUp}');

      expect(input.value).toBe('5');
    });

    it('supports interaction through the DynamoInputNumberHarness', async () => {
      const { fixture } = renderWithValue(5);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoInputNumberHarness,
      );

      expect(await harness.getValue()).toBe('5');
      await harness.increment();
      expect(await harness.getValue()).toBe('6');
      await harness.decrement();
      await harness.decrement();
      expect(await harness.getValue()).toBe('4');
      expect(await harness.isDisabled()).toBe(false);

      await harness.setValue('20');
      expect(await harness.getValue()).toBe('20');
    });
  });

  describe('conditional rendering', () => {
    it('only sets aria-invalid when invalid is true', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoInputNumber,
        { inputs: { ariaLabel: 'Quantity' } },
      );
      expect(
        within(container).getByRole('spinbutton').getAttribute('aria-invalid'),
      ).toBeNull();

      setInputs({ invalid: true });
      expect(
        within(container).getByRole('spinbutton').getAttribute('aria-invalid'),
      ).toBe('true');
    });
  });

  describe('template behavior', () => {
    it('applies different wrapper classes for the invalid vs. valid state', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoInputNumber,
        { inputs: { ariaLabel: 'Quantity' } },
      );
      const validClasses = container.querySelector('div')?.className;

      setInputs({ invalid: true });
      const invalidClasses = container.querySelector('div')?.className;

      expect(validClasses).not.toBe(invalidClasses);
    });
  });

  describe('readOnly', () => {
    it('blocks typed input and stepping via keyboard, keeps the value unchanged, and reflects aria-readonly', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { value: 5, readOnly: true, ariaLabel: 'Quantity' },
      });
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;
      input.focus();

      await userEvent.type(input, '9');
      await userEvent.keyboard('{ArrowUp}{PageUp}{Home}{End}');

      expect(input.value).toBe('5');
      expect(input.getAttribute('aria-readonly')).toBe('true');
    });

    it('disables both stepper buttons but keeps the input focusable and not disabled', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { value: 5, readOnly: true, ariaLabel: 'Quantity' },
      });
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;

      expect(input.disabled).toBe(false);
      expect(input.tabIndex).toBe(0);
      expect(
        (within(container).getByLabelText('Increment') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect(
        (within(container).getByLabelText('Decrement') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });

    it('ignores clicks on the stepper buttons', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { value: 5, readOnly: true, ariaLabel: 'Quantity' },
      });
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;

      await userEvent.click(within(container).getByLabelText('Increment'));

      expect(input.value).toBe('5');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when given an accessible name via ariaLabel', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });
      await expectNoA11yViolations(container);
    });

    it('flags a nameless spinbutton as an accessibility violation (sanity check)', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber);
      await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/i);
    });
  });

  describe('state changes', () => {
    it('disables the native input when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement)
          .disabled,
      ).toBe(true);
    });

    it('re-enables the native input when the bound FormControl is enabled again', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      componentInstance.control.disable();
      fixture.detectChanges();

      componentInstance.control.enable();
      fixture.detectChanges();

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement)
          .disabled,
      ).toBe(false);
    });

    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue(99);
      fixture.detectChanges();

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('99');
    });
  });

  describe('locale-aware display formatting', () => {
    it('groups thousands by default once blurred', () => {
      const { container } = renderWithValue(1234, {
        inputs: { locale: 'en-US' },
      });

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('1,234');
    });

    it('shows the plain unformatted value while focused, not the grouped one', () => {
      const { container, fixture } = renderWithValue(1234, {
        inputs: { locale: 'en-US' },
      });
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;

      input.focus();
      fixture.detectChanges();

      expect(input.value).toBe('1234');
    });

    it('disables grouping when useGrouping is false', () => {
      const { container } = renderWithValue(1234, {
        inputs: { locale: 'en-US', useGrouping: false },
      });

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('1234');
    });

    it('formats as currency when mode is currency', () => {
      const { container } = renderWithValue(19.9, {
        inputs: { locale: 'en-US', mode: 'currency', currency: 'USD' },
      });

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('$19.90');
    });

    it('pads to minFractionDigits', () => {
      const { container } = renderWithValue(5, {
        inputs: { locale: 'en-US', minFractionDigits: 2 },
      });

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('5.00');
    });

    it('rounds to maxFractionDigits', () => {
      const { container } = renderWithValue(5.6789, {
        inputs: { locale: 'en-US', maxFractionDigits: 2 },
      });

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('5.68');
    });
  });

  describe('prefix / suffix', () => {
    it('renders literal prefix/suffix text flush against the input, outside the editable value', () => {
      const { container } = renderWithValue(5, {
        inputs: { prefix: '$', suffix: '/mo' },
      });

      expect(
        container
          .querySelector('[data-testid="dg-input-number-prefix"]')
          ?.textContent?.trim(),
      ).toBe('$');
      expect(
        container
          .querySelector('[data-testid="dg-input-number-suffix"]')
          ?.textContent?.trim(),
      ).toBe('/mo');
      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('5');
    });

    it('renders no prefix/suffix element when unset', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });

      expect(
        container.querySelector('[data-testid="dg-input-number-prefix"]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-testid="dg-input-number-suffix"]'),
      ).toBeNull();
    });
  });

  describe('custom increment/decrement icons', () => {
    it('projects custom content into the buttons in place of the default glyphs', () => {
      @Component({
        selector: 'dg-input-number-custom-icon-host',
        standalone: true,
        imports: [DynamoInputNumber],
        template: `
          <dg-input-number ariaLabel="Quantity">
            <svg incrementIcon data-testid="custom-inc"></svg>
            <svg decrementIcon data-testid="custom-dec"></svg>
          </dg-input-number>
        `,
      })
      class CustomIconHostComponent {}

      const { container } = renderDynamoComponent(CustomIconHostComponent);

      expect(
        container.querySelector('[data-testid="custom-inc"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="custom-dec"]'),
      ).toBeTruthy();
      expect(
        within(container).getByLabelText('Increment').textContent?.trim(),
      ).toBe('');
      expect(
        within(container).getByLabelText('Decrement').textContent?.trim(),
      ).toBe('');
    });

    it('falls back to the default +/- glyphs when nothing is projected', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });

      expect(
        within(container).getByLabelText('Increment').textContent?.trim(),
      ).toBe('+');
      expect(
        within(container).getByLabelText('Decrement').textContent?.trim(),
      ).toBe('−');
    });
  });

  describe('edge cases', () => {
    it('leaves the value unchanged when step is zero or negative', async () => {
      const { container } = renderWithValue(5, { inputs: { step: 0 } });

      await userEvent.click(within(container).getByLabelText('Increment'));

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('5');
    });

    it('renders without throwing when min is greater than max, disabling both buttons', () => {
      const { container } = renderWithValue(5, {
        inputs: { min: 10, max: 0 },
      });

      expect(
        (within(container).getByLabelText('Increment') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect(
        (within(container).getByLabelText('Decrement') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });

    it('commits an empty string as null', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const input = within(container).getByRole(
        'spinbutton',
      ) as HTMLInputElement;
      input.focus();

      await userEvent.tab();

      expect(componentInstance.control.value).toBeNull();
    });

    it('handles a writeValue(null) call gracefully (renders as empty)', () => {
      const { fixture, container } = renderWithValue(5);

      fixture.componentInstance.writeValue(null);
      fixture.detectChanges();

      expect(
        (within(container).getByRole('spinbutton') as HTMLInputElement).value,
      ).toBe('');
    });
  });

  describe('showButtons', () => {
    it('renders both buttons, side by side, by default (regression)', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity' },
      });

      expect(
        within(container).getByRole('button', { name: 'Decrement' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: 'Increment' }),
      ).toBeTruthy();
      expect(container.querySelectorAll('button')).toHaveLength(2);
    });

    it('renders no buttons when false, but keeps the field and keyboard stepping working', async () => {
      const { container, componentInstance } = renderWithValue(5, {
        inputs: { showButtons: false, min: 0, max: 10 },
      });

      expect(container.querySelectorAll('button')).toHaveLength(0);
      const input = within(container).getByRole('spinbutton') as HTMLElement;
      input.focus();

      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance.value()).toBe(6);

      // 6 - step*10 (10) = -4, clamped up to min (0).
      await userEvent.keyboard('{PageDown}');
      expect(componentInstance.value()).toBe(0);
    });

    it('has no axe violations with showButtons false', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity', showButtons: false },
      });

      await expectNoA11yViolations(container);
    });
  });

  describe('buttonLayout', () => {
    it('groups both buttons into a single stacked wrapper, increment before decrement', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity', buttonLayout: 'stacked' },
      });

      const buttons = Array.from(container.querySelectorAll('button'));
      expect(buttons).toHaveLength(2);
      expect(buttons[0]?.getAttribute('aria-label')).toBe('Increment');
      expect(buttons[1]?.getAttribute('aria-label')).toBe('Decrement');
    });

    it('still increments/decrements and respects disabled bounds when stacked', async () => {
      const { container, componentInstance } = renderWithValue(5, {
        inputs: { buttonLayout: 'stacked', min: 5, max: 6 },
      });

      const incrementButton = within(container).getByRole('button', {
        name: 'Increment',
      }) as HTMLButtonElement;
      const decrementButton = within(container).getByRole('button', {
        name: 'Decrement',
      }) as HTMLButtonElement;
      expect(decrementButton.disabled).toBe(true);

      await userEvent.click(incrementButton);
      expect(componentInstance.value()).toBe(6);
      expect(incrementButton.disabled).toBe(true);
    });

    it("uses chevron icon fallbacks, not the horizontal layout's +/− glyphs", () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity', buttonLayout: 'stacked' },
      });

      expect(
        within(container).getByLabelText('Increment').querySelector('svg'),
      ).toBeTruthy();
      expect(
        within(container).getByLabelText('Increment').textContent?.trim(),
      ).toBe('');
      expect(
        within(container).getByLabelText('Decrement').querySelector('svg'),
      ).toBeTruthy();
    });

    it('is ignored (no stacked wrapper) when showButtons is false', () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: {
          ariaLabel: 'Quantity',
          showButtons: false,
          buttonLayout: 'stacked',
        },
      });

      expect(container.querySelectorAll('button')).toHaveLength(0);
    });

    it('has no axe violations with buttonLayout stacked', async () => {
      const { container } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity', buttonLayout: 'stacked' },
      });

      await expectNoA11yViolations(container);
    });
  });

  describe('DynamoInputNumberHarness with showButtons/buttonLayout', () => {
    it('still supports increment()/decrement()/isDisabled() when stacked', async () => {
      const { fixture, componentInstance } = renderWithValue(5, {
        inputs: { buttonLayout: 'stacked' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoInputNumberHarness,
      );

      await harness.increment();
      expect(componentInstance.value()).toBe(6);
      await harness.decrement();
      expect(componentInstance.value()).toBe(5);
      expect(await harness.isDisabled()).toBe(false);
    });

    it('throws from increment()/decrement() when showButtons is false (no button to click)', async () => {
      const { fixture } = renderDynamoComponent(DynamoInputNumber, {
        inputs: { ariaLabel: 'Quantity', showButtons: false },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoInputNumberHarness,
      );

      await expect(harness.increment()).rejects.toThrow();
    });
  });
});
