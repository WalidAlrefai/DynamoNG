import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoInputText } from './input-text';
import { DynamoInputTextHarness } from './input-text.harness';

@Component({
  selector: 'dg-input-text-reactive-form-host',
  standalone: true,
  imports: [DynamoInputText, ReactiveFormsModule],
  template: `<dg-input-text [formControl]="control" aria-label="Email" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'dg-input-text-ng-model-host',
  standalone: true,
  imports: [DynamoInputText, FormsModule],
  template: `<dg-input-text [(ngModel)]="value" aria-label="Name" />`,
})
class NgModelHostComponent {
  value = '';
}

describe('DynamoInputText', () => {
  describe('creation', () => {
    it('renders without errors with a native text input', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });

      expect(within(container).getByRole('textbox')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to type="text", empty value, not disabled, not invalid', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });

      const input = within(container).getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
      expect(input.value).toBe('');
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-invalid')).toBeNull();
    });
  });

  describe('input properties', () => {
    it('reflects the type input onto the native element', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { type: 'email', ariaLabel: 'Email' },
      });

      expect((container.querySelector('input') as HTMLInputElement).type).toBe(
        'email',
      );
    });

    it('reflects the placeholder input', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { placeholder: 'you@example.com', ariaLabel: 'Email' },
      });

      expect(
        within(container).getByPlaceholderText('you@example.com'),
      ).toBeTruthy();
    });

    it('reflects the disabled input onto the native element', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { disabled: true, ariaLabel: 'Name' },
      });

      expect(
        (within(container).getByRole('textbox') as HTMLInputElement).disabled,
      ).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoInputText,
        {
          inputs: { ariaLabel: 'Name' },
        },
      );

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    // DynamoInputText has no custom `output()` — value propagation happens
    // through the ControlValueAccessor's registerOnChange callback, which is
    // what a bound FormControl/ngModel receives.
    it('propagates typed input to a bound reactive FormControl', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      await userEvent.type(within(container).getByRole('textbox'), 'hello');

      expect(componentInstance.control.value).toBe('hello');
    });

    it('propagates typed input to an [(ngModel)] binding', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(NgModelHostComponent);

      await userEvent.type(within(container).getByRole('textbox'), 'Ada');

      expect(componentInstance.value).toBe('Ada');
    });
  });

  describe('user interactions', () => {
    it('accepts typed text and reflects it in the input value', async () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'Ada Lovelace');

      expect(input.value).toBe('Ada Lovelace');
    });

    it('marks the FormControl as touched on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);

      const input = within(container).getByRole('textbox');
      input.focus();
      await userEvent.tab();

      expect(componentInstance.control.touched).toBe(true);
    });

    it('supports interaction through the DynamoInputTextHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoInputTextHarness,
      );

      await harness.setValue('Grace Hopper');

      expect(await harness.getValue()).toBe('Grace Hopper');
    });
  });

  describe('conditional rendering', () => {
    it('only sets aria-invalid when invalid is true', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      expect(
        within(container).getByRole('textbox').getAttribute('aria-invalid'),
      ).toBeNull();

      setInputs({ invalid: true });
      expect(
        within(container).getByRole('textbox').getAttribute('aria-invalid'),
      ).toBe('true');
    });
  });

  describe('template behavior', () => {
    it('applies different classes for the invalid vs. valid state', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      const validClasses = container.querySelector('input')?.className;

      setInputs({ invalid: true });
      const invalidClasses = container.querySelector('input')?.className;

      expect(validClasses).not.toBe(invalidClasses);
    });
  });

  describe('readOnly', () => {
    it('blocks typed input, keeps the value unchanged, and reflects aria-readonly', async () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { value: 'Ada', readOnly: true, ariaLabel: 'Name' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'Lovelace');

      expect(input.value).toBe('Ada');
      expect(input.getAttribute('aria-readonly')).toBe('true');
    });

    it('stays focusable and not disabled, unlike the disabled state', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { readOnly: true, ariaLabel: 'Name' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      expect(input.disabled).toBe(false);
      expect(input.tabIndex).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when given an accessible name via aria-label', async () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('flags a nameless input as an accessibility violation (sanity check on the test helper itself)', async () => {
      const { container } = renderDynamoComponent(DynamoInputText);
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
        (within(container).getByRole('textbox') as HTMLInputElement).disabled,
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
        (within(container).getByRole('textbox') as HTMLInputElement).disabled,
      ).toBe(false);
    });

    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue('preset value');
      fixture.detectChanges();

      expect(
        (within(container).getByRole('textbox') as HTMLInputElement).value,
      ).toBe('preset value');
    });
  });

  describe('edge cases', () => {
    it('handles an empty string value without throwing', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });

      expect(
        (within(container).getByRole('textbox') as HTMLInputElement).value,
      ).toBe('');
    });

    it('handles a writeValue(null) call gracefully (falls back to empty string)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });

      fixture.componentInstance.writeValue(null as unknown as string);
      fixture.detectChanges();

      expect(
        (within(container).getByRole('textbox') as HTMLInputElement).value,
      ).toBe('');
    });

    it('handles very long input values without throwing', async () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      const longValue = 'a'.repeat(300);

      await userEvent.type(within(container).getByRole('textbox'), longValue);

      expect(
        (within(container).getByRole('textbox') as HTMLInputElement).value,
      ).toHaveLength(300);
    });
  });

  describe('passthrough (pt)', () => {
    it('merges pt.root attrs/class onto the wrapper and pt.input onto the native input', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: {
          ariaLabel: 'Name',
          showClear: true,
          value: 'x',
          pt: {
            root: { class: 'ring-2', 'data-testid': 'root-el' },
            input: { class: 'tracking-wide', 'data-testid': 'input-el' },
          },
        },
      });

      const wrapper = container.querySelector(
        '[data-testid="root-el"]',
      ) as HTMLElement;
      const input = container.querySelector(
        '[data-testid="input-el"]',
      ) as HTMLInputElement;
      expect(wrapper.className).toContain('ring-2');
      expect(input.className).toContain('tracking-wide');
    });
  });

  describe('fluid', () => {
    it('applies w-full by default', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      expect(container.querySelector('input')?.className).toContain('w-full');
    });

    it('drops w-full when fluid is set to false', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name', fluid: false },
      });
      expect(container.querySelector('input')?.className).not.toContain(
        'w-full',
      );
    });
  });

  describe('variant', () => {
    it('applies filled background classes and drops the outlined background', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name', variant: 'filled' },
      });
      const className = container.querySelector('input')?.className ?? '';
      expect(className).toContain('bg-surface-100');
      expect(className).not.toContain('bg-surface-0');
    });
  });

  describe('showClear', () => {
    it('is absent when there is no value', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name', showClear: true },
      });
      expect(within(container).queryByRole('button')).toBeNull();
    });

    it('appears once there is a value, and clears it on click, refocusing the input', async () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name', showClear: true, value: 'Ada' },
      });

      const clearButton = within(container).getByRole('button', {
        name: 'Clear',
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      await userEvent.click(clearButton);

      expect(input.value).toBe('');
      expect(document.activeElement).toBe(input);
    });

    it('stays hidden while disabled, even with a value', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: {
          ariaLabel: 'Name',
          showClear: true,
          value: 'Ada',
          disabled: true,
        },
      });
      expect(within(container).queryByRole('button')).toBeNull();
    });

    it('stays hidden while readOnly, even with a value', () => {
      const { container } = renderDynamoComponent(DynamoInputText, {
        inputs: {
          ariaLabel: 'Name',
          showClear: true,
          value: 'Ada',
          readOnly: true,
        },
      });
      expect(within(container).queryByRole('button')).toBeNull();
    });
  });

  describe('ariaDescribedby', () => {
    it('reflects onto the native input when set, and omits it otherwise', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoInputText, {
        inputs: { ariaLabel: 'Name' },
      });
      expect(
        within(container).getByRole('textbox').getAttribute('aria-describedby'),
      ).toBeNull();

      setInputs({ ariaDescribedby: 'name-help' });
      expect(
        within(container).getByRole('textbox').getAttribute('aria-describedby'),
      ).toBe('name-help');
    });
  });
});
