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
import { DynamoTextarea } from './textarea';
import { DynamoTextareaHarness } from './textarea.harness';

@Component({
  selector: 'dg-textarea-reactive-form-host',
  standalone: true,
  imports: [DynamoTextarea, ReactiveFormsModule],
  template: `<dg-textarea [formControl]="control" aria-label="Bio" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'dg-textarea-ng-model-host',
  standalone: true,
  imports: [DynamoTextarea, FormsModule],
  template: `<dg-textarea [(ngModel)]="value" aria-label="Notes" />`,
})
class NgModelHostComponent {
  value = '';
}

describe('DynamoTextarea', () => {
  describe('creation', () => {
    it('renders without errors with a native textarea element', () => {
      const { container } = renderDynamoComponent(DynamoTextarea);

      expect(within(container).getByRole('textbox')).toBeTruthy();
      expect(container.querySelector('textarea')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to empty value, 3 rows, not disabled, not invalid, autoResize off', () => {
      const { container } = renderDynamoComponent(DynamoTextarea);

      const textarea = within(container).getByRole(
        'textbox',
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
      expect(textarea.rows).toBe(3);
      expect(textarea.disabled).toBe(false);
      expect(textarea.getAttribute('aria-invalid')).toBeNull();
    });
  });

  describe('input properties', () => {
    it('reflects the placeholder input', () => {
      const { container } = renderDynamoComponent(DynamoTextarea, {
        inputs: { placeholder: 'Tell us more' },
      });

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement)
          .placeholder,
      ).toBe('Tell us more');
    });

    it('reflects the disabled input onto the native element', () => {
      const { container } = renderDynamoComponent(DynamoTextarea, {
        inputs: { disabled: true },
      });

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement)
          .disabled,
      ).toBe(true);
    });

    it('reflects the rows input onto the native element', () => {
      const { container } = renderDynamoComponent(DynamoTextarea, {
        inputs: { rows: 6 },
      });

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement).rows,
      ).toBe(6);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoTextarea);

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
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

      await userEvent.type(within(container).getByRole('textbox'), 'hi');

      expect(componentInstance.value).toBe('hi');
    });
  });

  describe('user interactions', () => {
    it('accepts typed text and reflects it in the textarea value', async () => {
      const { container } = renderDynamoComponent(DynamoTextarea);
      const textarea = within(container).getByRole(
        'textbox',
      ) as HTMLTextAreaElement;

      await userEvent.type(textarea, 'line one');

      expect(textarea.value).toBe('line one');
    });

    it('marks the FormControl as touched on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const textarea = within(container).getByRole('textbox');

      expect(componentInstance.control.touched).toBe(false);
      await userEvent.click(textarea);
      await userEvent.tab();

      expect(componentInstance.control.touched).toBe(true);
    });

    it('supports interaction through the DynamoTextareaHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoTextarea);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTextareaHarness,
      );

      expect(await harness.getValue()).toBe('');
      await harness.setValue('typed via harness');
      expect(await harness.getValue()).toBe('typed via harness');
    });

    it('reports disabled state through the DynamoTextareaHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoTextarea, {
        inputs: { disabled: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTextareaHarness,
      );

      expect(await harness.isDisabled()).toBe(true);
    });
  });

  describe('conditional rendering', () => {
    it('only sets aria-invalid when invalid is true', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoTextarea);
      const textarea = within(container).getByRole('textbox');
      expect(textarea.getAttribute('aria-invalid')).toBeNull();

      setInputs({ invalid: true });

      expect(textarea.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('template behavior', () => {
    it('applies different classes for the invalid vs. valid state', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoTextarea, {
        inputs: { invalid: false },
      });
      const textarea = within(container).getByRole('textbox');
      const validClasses = textarea.className;

      setInputs({ invalid: true });

      expect(textarea.className).not.toBe(validClasses);
    });

    it('applies different classes when autoResize is toggled', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoTextarea, {
        inputs: { autoResize: false },
      });
      const textarea = within(container).getByRole('textbox');
      const fixedClasses = textarea.className;

      setInputs({ autoResize: true });

      expect(textarea.className).not.toBe(fixedClasses);
    });

    it('does not throw while resizing as content is typed with autoResize enabled', async () => {
      const { container } = renderDynamoComponent(DynamoTextarea, {
        inputs: { autoResize: true },
      });
      const textarea = within(container).getByRole('textbox');

      await expect(
        userEvent.type(textarea, 'a\nb\nc\nd'),
      ).resolves.not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when given an accessible name via aria-label', async () => {
      const { container } = renderDynamoComponent(DynamoTextarea, {
        inputs: { ariaLabel: 'Bio' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('flags a nameless textarea as an accessibility violation (sanity check on the test helper itself)', async () => {
      const { container } = renderDynamoComponent(DynamoTextarea);
      await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/i);
    });
  });

  describe('state changes', () => {
    it('disables the native textarea when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement)
          .disabled,
      ).toBe(true);
    });

    it('re-enables the native textarea when the bound FormControl is enabled again', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();
      componentInstance.control.enable();
      fixture.detectChanges();

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement)
          .disabled,
      ).toBe(false);
    });

    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue('set programmatically');
      fixture.detectChanges();

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement).value,
      ).toBe('set programmatically');
    });
  });

  describe('edge cases', () => {
    it('handles an empty string value without throwing', () => {
      const { container } = renderDynamoComponent(DynamoTextarea);

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement).value,
      ).toBe('');
    });

    it('handles a writeValue(null) call gracefully (falls back to empty string)', () => {
      const { fixture, container, componentInstance } =
        renderDynamoComponent(DynamoTextarea);

      componentInstance.writeValue(null);
      fixture.detectChanges();

      expect(
        (within(container).getByRole('textbox') as HTMLTextAreaElement).value,
      ).toBe('');
    });

    it('handles very long multi-line input values without throwing', async () => {
      const { container } = renderDynamoComponent(DynamoTextarea);
      const textarea = within(container).getByRole('textbox');
      const longValue = Array.from({ length: 20 }, (_, i) => `line ${i}`).join(
        '\n',
      );

      await expect(userEvent.type(textarea, longValue)).resolves.not.toThrow();
    });
  });
});
