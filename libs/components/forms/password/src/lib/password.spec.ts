import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoPassword } from './password';
import { DynamoPasswordHarness } from './password.harness';

@Component({
  selector: 'dg-password-reactive-form-host',
  standalone: true,
  imports: [DynamoPassword, ReactiveFormsModule],
  template: `<dg-password [formControl]="control" aria-label="Password" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'dg-password-ng-model-host',
  standalone: true,
  imports: [DynamoPassword, FormsModule],
  template: `<dg-password [(ngModel)]="value" aria-label="Password" />`,
})
class NgModelHostComponent {
  value = '';
}

describe('DynamoPassword', () => {
  describe('creation', () => {
    it('renders without errors with a native masked input', () => {
      const { container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('password');
    });
  });

  describe('default behavior', () => {
    it('defaults to type="password", empty value, not disabled, not invalid, toggle labeled "Show password"', () => {
      const { container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('password');
      expect(input.value).toBe('');
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-invalid')).toBeNull();
      expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Show password');
    });
  });

  describe('show/hide toggle', () => {
    it('clicking the toggle swaps input.type from password to text and back', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      const input = container.querySelector('input') as HTMLInputElement;
      const toggle = container.querySelector('button') as HTMLButtonElement;

      toggle.click();
      fixture.detectChanges();
      expect(input.type).toBe('text');

      toggle.click();
      fixture.detectChanges();
      expect(input.type).toBe('password');
    });

    it('clicking the toggle swaps the accessible name from Show to Hide and back', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      const toggle = container.querySelector('button') as HTMLButtonElement;

      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-label')).toBe('Hide password');

      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-label')).toBe('Show password');
    });

    it('does not clear or mutate the typed value when toggled', async () => {
      const { fixture, container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      const input = container.querySelector('input') as HTMLInputElement;
      const toggle = container.querySelector('button') as HTMLButtonElement;

      await userEvent.type(input, 'sekrit');
      toggle.click();
      fixture.detectChanges();

      expect(input.value).toBe('sekrit');
    });
  });

  describe('input properties', () => {
    it('reflects the placeholder input', () => {
      const { container } = renderDynamoComponent(DynamoPassword, {
        inputs: { placeholder: 'Enter password', ariaLabel: 'Password' },
      });

      expect(within(container).getByPlaceholderText('Enter password')).toBeTruthy();
    });

    it('reflects the disabled input onto the native element', () => {
      const { container } = renderDynamoComponent(DynamoPassword, {
        inputs: { disabled: true, ariaLabel: 'Password' },
      });

      expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    });

    it('only sets aria-invalid when invalid is true', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      expect(container.querySelector('input')?.getAttribute('aria-invalid')).toBeNull();

      setInputs({ invalid: true });
      expect(container.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(DynamoPassword, {
        inputs: { ariaLabel: 'Password' },
      });

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    it('propagates typed input to a bound reactive FormControl', async () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);

      await userEvent.type(container.querySelector('input') as HTMLInputElement, 'hello');

      expect(componentInstance.control.value).toBe('hello');
    });

    it('propagates typed input to an [(ngModel)] binding', async () => {
      const { container, componentInstance } = renderDynamoComponent(NgModelHostComponent);

      await userEvent.type(container.querySelector('input') as HTMLInputElement, 'Ada');

      expect(componentInstance.value).toBe('Ada');
    });
  });

  describe('user interactions', () => {
    it('marks the FormControl as touched on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      expect(componentInstance.control.touched).toBe(false);

      const input = container.querySelector('input') as HTMLInputElement;
      input.focus();
      await userEvent.tab();

      expect(componentInstance.control.touched).toBe(true);
    });

    it('supports interaction through the DynamoPasswordHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoPasswordHarness);

      await harness.setValue('Grace Hopper');
      expect(await harness.getValue()).toBe('Grace Hopper');
      expect(await harness.isMasked()).toBe(true);

      await harness.toggleVisibility();
      expect(await harness.isMasked()).toBe(false);
    });
  });

  describe('strength meter', () => {
    it('is not rendered when showStrengthMeter is false', () => {
      const { container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });

      expect(container.querySelector('[role="progressbar"]')).toBeNull();
    });

    it('is rendered when showStrengthMeter is true', () => {
      const { container } = renderDynamoComponent(DynamoPassword, {
        inputs: { ariaLabel: 'Password', showStrengthMeter: true },
      });

      expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    });

    it('maps a weak password to danger severity', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPassword, {
        inputs: { ariaLabel: 'Password', showStrengthMeter: true },
      });
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.input(input, { target: { value: 'abc' } });
      fixture.detectChanges();

      expect(container.querySelector('[role="progressbar"] > div')?.className).toContain('danger');
      expect(container.textContent).toContain('weak');
    });

    it('maps a medium password to warning severity', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPassword, {
        inputs: { ariaLabel: 'Password', showStrengthMeter: true },
      });
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.input(input, { target: { value: 'abcdefgh1' } });
      fixture.detectChanges();

      expect(container.querySelector('[role="progressbar"] > div')?.className).toContain('warning');
      expect(container.textContent).toContain('medium');
    });

    it('maps a strong password to success severity', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPassword, {
        inputs: { ariaLabel: 'Password', showStrengthMeter: true },
      });
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.input(input, { target: { value: 'Abcdefghij12!@' } });
      fixture.detectChanges();

      expect(container.querySelector('[role="progressbar"] > div')?.className).toContain('success');
      expect(container.textContent).toContain('strong');
    });

    it('sets aria-describedby on the input to the meter id only when the meter is shown', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-describedby')).toBeNull();

      setInputs({ showStrengthMeter: true });
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(container.querySelector(`#${describedBy}`)).not.toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with the meter hidden', async () => {
      const { container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with the meter shown', async () => {
      const { container } = renderDynamoComponent(DynamoPassword, {
        inputs: { ariaLabel: 'Password', showStrengthMeter: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('state changes', () => {
    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);

      componentInstance.control.setValue('preset value');
      fixture.detectChanges();

      expect((container.querySelector('input') as HTMLInputElement).value).toBe('preset value');
    });

    it('disables the native input when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);

      componentInstance.control.disable();
      fixture.detectChanges();

      expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles an empty string value without throwing', () => {
      const { container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });

      expect((container.querySelector('input') as HTMLInputElement).value).toBe('');
    });

    it('handles a writeValue(null) call gracefully (falls back to empty string)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });

      fixture.componentInstance.writeValue(null as unknown as string);
      fixture.detectChanges();

      expect((container.querySelector('input') as HTMLInputElement).value).toBe('');
    });

    it('handles very long input values without throwing', async () => {
      const { container } = renderDynamoComponent(DynamoPassword, { inputs: { ariaLabel: 'Password' } });
      const longValue = 'a'.repeat(300);

      await userEvent.type(container.querySelector('input') as HTMLInputElement, longValue);

      expect((container.querySelector('input') as HTMLInputElement).value).toHaveLength(300);
    });
  });
});
