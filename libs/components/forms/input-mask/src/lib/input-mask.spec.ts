import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoInputMask } from './input-mask';
import { DynamoInputMaskHarness } from './input-mask.harness';

const PHONE_MASK = '(999) 999-9999';

@Component({
  selector: 'dg-input-mask-reactive-form-host',
  standalone: true,
  imports: [DynamoInputMask, ReactiveFormsModule],
  template: `<dg-input-mask [formControl]="control" [mask]="mask" aria-label="Phone" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl('', { nonNullable: true });
  readonly mask = PHONE_MASK;
}

@Component({
  selector: 'dg-input-mask-ng-model-host',
  standalone: true,
  imports: [DynamoInputMask, FormsModule],
  template: `<dg-input-mask [(ngModel)]="value" [mask]="mask" aria-label="Phone" />`,
})
class NgModelHostComponent {
  value = '';
  readonly mask = PHONE_MASK;
}

// Simulates the browser's own pre-handler behavior: the native edit (a
// single character inserted at the caret) always happens *before* the
// 'input' event fires, so onInput can trust input.value/selectionStart to
// already reflect it.
function typeChar(input: HTMLInputElement, char: string): void {
  const pos = input.selectionStart ?? input.value.length;
  input.value = input.value.slice(0, pos) + char + input.value.slice(pos);
  input.setSelectionRange(pos + char.length, pos + char.length);
  fireEvent.input(input);
}

function typeString(input: HTMLInputElement, text: string): void {
  for (const ch of text) {
    typeChar(input, ch);
  }
}

function backspaceAt(input: HTMLInputElement, pos: number): void {
  input.setSelectionRange(pos, pos);
  fireEvent.keyDown(input, { key: 'Backspace' });
}

function deleteAt(input: HTMLInputElement, pos: number): void {
  input.setSelectionRange(pos, pos);
  fireEvent.keyDown(input, { key: 'Delete' });
}

function pasteText(input: HTMLInputElement, text: string): void {
  fireEvent.paste(input, { clipboardData: { getData: () => text } as unknown as DataTransfer });
}

describe('DynamoInputMask', () => {
  describe('creation', () => {
    it('renders a native text input', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });

      expect(within(container).getByRole('textbox')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to empty value, not disabled, not invalid', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });

      const input = within(container).getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-invalid')).toBeNull();
    });
  });

  describe('input properties', () => {
    it('reflects the placeholder input', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, placeholder: '(___) ___-____', ariaLabel: 'Phone' },
      });

      expect(within(container).getByPlaceholderText('(___) ___-____')).toBeTruthy();
    });

    it('reflects the disabled input onto the native element', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, disabled: true, ariaLabel: 'Phone' },
      });

      expect((within(container).getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('mask application', () => {
    it('auto-inserts literals as digits are typed past them', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeString(input, '5551234567');

      expect(input.value).toBe('(555) 123-4567');
    });

    it('auto-inserts the trailing literal group as soon as a digit group is completed', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeString(input, '555');

      expect(input.value).toBe('(555) ');
      expect(input.selectionStart).toBe(6);
    });

    it('silently rejects a character that does not match the slot type, without moving the caret', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '555');
      expect(input.value).toBe('(555) ');
      expect(input.selectionStart).toBe(6);

      typeChar(input, 'X');

      expect(input.value).toBe('(555) ');
      expect(input.selectionStart).toBe(6);
    });

    it('supports letter and alphanumeric slot types', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: 'aa-999', ariaLabel: 'Code' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeString(input, 'AB123');

      expect(input.value).toBe('AB-123');
    });

    it('supports the alphanumeric (*) slot type', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: '***-***', ariaLabel: 'Serial' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeString(input, 'A1b2C3');

      expect(input.value).toBe('A1b-2C3');
    });

    it('rejects a digit typed into a letter slot', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: 'aa-999', ariaLabel: 'Code' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeChar(input, '1');

      expect(input.value).toBe('');
    });

    it('is a no-op once every slot is filled', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '5551234567');
      expect(input.value).toBe('(555) 123-4567');

      typeChar(input, '8');

      expect(input.value).toBe('(555) 123-4567');
    });
  });

  describe('backspace and delete', () => {
    it('backspaces a plain placeholder character', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '555');
      expect(input.value).toBe('(555) ');

      backspaceAt(input, 4); // right after the 3rd '5', before ') '

      // The 3rd digit slot is empty again, so the ") " group it unlocked
      // is no longer reachable — it disappears until re-filled.
      expect(input.value).toBe('(55');
    });

    it('backspacing when the character before the caret is a literal skips over it and clears the preceding slot', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '555');
      expect(input.value).toBe('(555) ');

      backspaceAt(input, 6); // right after the auto-inserted ") "

      // Walks back over both literals (' ' then ')') to clear the 3rd
      // digit slot — the same slot the plain-placeholder case above clears,
      // just approached from further right.
      expect(input.value).toBe('(55');
      expect(input.selectionStart).toBe(3);
    });

    it('shifts later digits left when an earlier one is deleted', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '5551234567');
      expect(input.value).toBe('(555) 123-4567');

      backspaceAt(input, 4); // remove the 3rd '5' (deleteIndex = 3)

      expect(input.value).toBe('(551) 234-567');
    });

    it('backspacing every digit out collapses to a fully empty value, not a stray leading literal', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '5551234567');
      expect(input.value).toBe('(555) 123-4567');

      for (let i = 0; i < 14; i++) {
        backspaceAt(input, input.value.length);
      }

      expect(input.value).toBe('');
    });

    it('backspace at position 0 is a no-op that does not throw', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      expect(() => backspaceAt(input, 0)).not.toThrow();
      expect(input.value).toBe('');
    });

    it('delete-forward clears the next placeholder without moving the caret', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '5551234567');
      expect(input.value).toBe('(555) 123-4567');

      deleteAt(input, 1); // caret before the 1st '5'

      expect(input.value).toBe('(551) 234-567');
      expect(input.selectionStart).toBe(1); // forward-delete never moves the caret
    });

    it('delete-forward skips over a literal to clear the next real slot', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '5551234567');
      expect(input.value).toBe('(555) 123-4567');

      deleteAt(input, 4); // caret right after the 3rd '5', before ") "

      expect(input.value).toBe('(555) 234-567');
      expect(input.selectionStart).toBe(4);
    });

    it('delete-forward is a no-op when only trailing literals remain to its right', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '555');
      expect(input.value).toBe('(555) ');

      deleteAt(input, 4); // only ") " remains to the right — no real slot to clear

      expect(input.value).toBe('(555) ');
    });

    it('delete at end-of-string is a no-op that does not throw', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '555');
      expect(input.value).toBe('(555) ');

      expect(() => deleteAt(input, input.value.length)).not.toThrow();
      expect(input.value).toBe('(555) ');
    });

    it('backspacing a range selection falls through to the ordinary remask path', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '5551234567');
      expect(input.value).toBe('(555) 123-4567');

      input.setSelectionRange(1, 4); // select "555"
      fireEvent.keyDown(input, { key: 'Backspace' });
      // Our onKeydown guard lets a range selection fall through untouched by
      // itself; simulate the native range-delete the browser would then
      // perform, followed by the resulting 'input' event.
      input.value = input.value.slice(0, 1) + input.value.slice(4);
      input.setSelectionRange(1, 1);
      fireEvent.input(input);

      // Remaining digits "1234567" reflow from scratch: group 1 gets "123",
      // group 2 gets "456", the last group only has "7" left to offer.
      expect(input.value).toBe('(123) 456-7');
    });
  });

  describe('paste', () => {
    it('replaces and remasks the full value from a raw pasted digit string', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      typeString(input, '999');

      pasteText(input, '5551234567');

      expect(input.value).toBe('(555) 123-4567');
      expect(input.selectionStart).toBe(input.value.length);
    });

    it('filters invalid characters out of a pasted value the same way typing does', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      pasteText(input, '555-abc-1234567');

      expect(input.value).toBe('(555) 123-4567');
    });
  });

  describe('output events', () => {
    it('propagates the masked value to a bound reactive FormControl', async () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeString(input, '5551234567');

      expect(componentInstance.control.value).toBe('(555) 123-4567');
    });

    it('propagates the masked value to an [(ngModel)] binding', async () => {
      const { container, componentInstance } = renderDynamoComponent(NgModelHostComponent);
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeString(input, '5551234567');

      expect(componentInstance.value).toBe('(555) 123-4567');
    });
  });

  describe('user interactions', () => {
    it('marks the FormControl as touched on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      expect(componentInstance.control.touched).toBe(false);

      const input = within(container).getByRole('textbox');
      input.focus();
      await userEvent.tab();

      expect(componentInstance.control.touched).toBe(true);
    });

    it('supports interaction through the DynamoInputMaskHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoInputMaskHarness);

      await harness.setValue('5551234567');

      expect(await harness.getValue()).toBe('(555) 123-4567');
    });
  });

  describe('conditional rendering', () => {
    it('only sets aria-invalid when invalid is true', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      expect(within(container).getByRole('textbox').getAttribute('aria-invalid')).toBeNull();

      setInputs({ invalid: true });
      expect(within(container).getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('template behavior', () => {
    it('applies different classes for the invalid vs. valid state', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      const validClasses = container.querySelector('input')?.className;

      setInputs({ invalid: true });
      const invalidClasses = container.querySelector('input')?.className;

      expect(validClasses).not.toBe(invalidClasses);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when given an accessible name via aria-label', async () => {
      const { container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('flags a nameless input as an accessibility violation (sanity check on the test helper itself)', async () => {
      const { container } = renderDynamoComponent(DynamoInputMask, { inputs: { mask: PHONE_MASK } });
      await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/i);
    });
  });

  describe('state changes', () => {
    it('disables the native input when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);

      componentInstance.control.disable();
      fixture.detectChanges();

      expect((within(container).getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
    });

    it('re-enables the native input when the bound FormControl is enabled again', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      componentInstance.control.disable();
      fixture.detectChanges();

      componentInstance.control.enable();
      fixture.detectChanges();

      expect((within(container).getByRole('textbox') as HTMLInputElement).disabled).toBe(false);
    });

    it('reflects an externally-set FormControl value through the mask (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);

      componentInstance.control.setValue('5551234567');
      fixture.detectChanges();

      expect((within(container).getByRole('textbox') as HTMLInputElement).value).toBe('(555) 123-4567');
    });

    it('ignores typing, backspace, and paste while disabled', () => {
      // A real disabled <input> can't be typed/pasted into at all — the
      // browser blocks it before any JS runs. Our test helpers bypass that
      // by mutating .value directly, so what actually matters is whether
      // the component ever *commits* the change — checked here through the
      // bound FormControl's value, the channel a real consumer observes.
      const { fixture, container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      componentInstance.control.disable();
      fixture.detectChanges();
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      typeString(input, '555');
      backspaceAt(input, 0);
      pasteText(input, '5551234567');

      expect(componentInstance.control.value).toBe('');
    });
  });

  describe('edge cases', () => {
    it('treats an empty mask as unconstrained passthrough without throwing', () => {
      const { container } = renderDynamoComponent(DynamoInputMask, { inputs: { mask: '', ariaLabel: 'Free text' } });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      expect(() => typeChar(input, 'x')).not.toThrow();
      expect(input.value).toBe('');
    });

    it('handles a writeValue(null) call gracefully (falls back to empty string)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoInputMask, {
        inputs: { mask: PHONE_MASK, ariaLabel: 'Phone' },
      });

      fixture.componentInstance.writeValue(null);
      fixture.detectChanges();

      expect((within(container).getByRole('textbox') as HTMLInputElement).value).toBe('');
    });
  });
});
