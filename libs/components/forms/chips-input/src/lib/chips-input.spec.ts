import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoChipsInput } from './chips-input';
import { DynamoChipsInputHarness } from './chips-input.harness';

@Component({
  selector: 'dg-chips-input-reactive-form-host',
  standalone: true,
  imports: [DynamoChipsInput, ReactiveFormsModule],
  template: `<dg-chips-input [formControl]="control" ariaLabel="Tags" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl<string[]>([], { nonNullable: true });
}

@Component({
  selector: 'dg-chips-input-ng-model-host',
  standalone: true,
  imports: [DynamoChipsInput, FormsModule],
  template: `<dg-chips-input [(ngModel)]="value" ariaLabel="Tags" />`,
})
class NgModelHostComponent {
  value: string[] = [];
}

function chips(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('[data-testid="DynamoChipsInput-chip"]'),
  ).map((el) => el.textContent?.trim() ?? '');
}

function pasteEvent(text: string): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: () => text },
  });
  return event;
}

describe('DynamoChipsInput', () => {
  describe('creation', () => {
    it('renders an empty wrapper with the placeholder visible', () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { placeholder: 'Add a tag', ariaLabel: 'Tags' },
      });

      expect(chips(container)).toEqual([]);
      expect(within(container).getByPlaceholderText('Add a tag')).toBeTruthy();
    });
  });

  describe('user interactions', () => {
    it('commits a chip on Enter and clears the draft', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'angular{Enter}');

      expect(chips(container)).toEqual(['angular']);
      expect(input.value).toBe('');
    });

    it('commits a chip on comma', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');

      await userEvent.type(input, 'angular,');

      expect(chips(container)).toEqual(['angular']);
    });

    it('clears the native input value synchronously on commit, not just via change detection', () => {
      // Regression test: fires the commit without an intervening
      // fixture.detectChanges() to prove the DOM value is reset by the
      // handler itself, not left to depend on a render cycle running before
      // the next keystroke arrives (see chips-input.ts's commitDraft doc
      // comment — this is what protects fast/rapid typing).
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      input.value = 'angular';
      fireEvent.input(input);

      fireEvent.keyDown(input, { key: ',' });

      expect(input.value).toBe('');
    });

    it('removes the last chip on Backspace from an empty draft', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');
      await userEvent.type(input, 'one{Enter}two{Enter}');

      await userEvent.type(input, '{Backspace}');

      expect(chips(container)).toEqual(['one']);
    });

    it('does not remove a chip on Backspace while the draft has text', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');
      await userEvent.type(input, 'one{Enter}');

      await userEvent.type(input, 'ab{Backspace}');

      expect(chips(container)).toEqual(['one']);
    });

    it('removes a specific chip via its own remove button, not just the last one', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');
      await userEvent.type(input, 'one{Enter}two{Enter}three{Enter}');

      await userEvent.click(within(container).getByLabelText('Remove two'));

      expect(chips(container)).toEqual(['one', 'three']);
    });

    it('rejects a duplicate by default', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');

      await userEvent.type(input, 'one{Enter}one{Enter}');

      expect(chips(container)).toEqual(['one']);
    });

    it('accepts a duplicate when allowDuplicates is set', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags', allowDuplicates: true },
      });
      const input = within(container).getByRole('textbox');

      await userEvent.type(input, 'one{Enter}one{Enter}');

      expect(chips(container)).toEqual(['one', 'one']);
    });

    it('caps additions at max', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags', max: 2 },
      });
      const input = within(container).getByRole('textbox');

      await userEvent.type(input, 'one{Enter}two{Enter}three{Enter}');

      expect(chips(container)).toEqual(['one', 'two']);
    });

    it('splits a comma-separated paste into multiple chips', () => {
      const { fixture, container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');

      input.dispatchEvent(pasteEvent('a,b,c'));
      fixture.detectChanges();

      expect(chips(container)).toEqual(['a', 'b', 'c']);
    });

    it('lets a plain single-value paste (no comma) land in the field normally', () => {
      const { fixture, container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;

      const event = pasteEvent('angular');
      const wasCancelled = !input.dispatchEvent(event);
      fixture.detectChanges();

      expect(wasCancelled).toBe(false);
      expect(chips(container)).toEqual([]);
    });

    it('commits an unfinished draft on blur', () => {
      const { fixture, container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox') as HTMLInputElement;
      input.value = 'angular';
      fireEvent.input(input);

      fireEvent.blur(input);
      fixture.detectChanges();

      expect(chips(container)).toEqual(['angular']);
    });

    it('does nothing on Enter with an empty or whitespace-only draft', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');

      await userEvent.type(input, '{Enter}');
      await userEvent.type(input, '   {Enter}');

      expect(chips(container)).toEqual([]);
    });

    it('refocuses the input after removing a chip', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');
      await userEvent.type(input, 'one{Enter}');

      await userEvent.click(within(container).getByLabelText('Remove one'));

      expect(document.activeElement).toBe(input);
    });

    it('supports interaction through the DynamoChipsInputHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoChipsInputHarness,
      );

      await harness.addChip('one');
      await harness.addChip('two');
      expect(await harness.getChips()).toEqual(['one', 'two']);

      await harness.removeChip(0);
      expect(await harness.getChips()).toEqual(['two']);
    });
  });

  describe('output events', () => {
    it('propagates committed chips to a bound reactive FormControl', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const input = within(container).getByRole('textbox');

      await userEvent.type(input, 'one{Enter}');

      expect(componentInstance.control.value).toEqual(['one']);
    });

    it('propagates committed chips to an [(ngModel)] binding', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        NgModelHostComponent,
      );
      const input = within(container).getByRole('textbox');

      await userEvent.type(input, 'one{Enter}');

      expect(componentInstance.value).toEqual(['one']);
    });
  });

  describe('state changes', () => {
    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue(['a', 'b']);
      fixture.detectChanges();

      expect(chips(container)).toEqual(['a', 'b']);
    });

    it('marks the FormControl as touched on blur', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);

      fireEvent.blur(within(container).getByRole('textbox'));
      fixture.detectChanges();

      expect(componentInstance.control.touched).toBe(true);
    });

    it('disables typing, adding, and removing when the FormControl is disabled', async () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      componentInstance.control.setValue(['one']);
      componentInstance.control.disable();
      fixture.detectChanges();

      const input = within(container).getByRole('textbox') as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(
        (within(container).getByLabelText('Remove one') as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('gives each remove button a "Remove {chip}" aria-label', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      const input = within(container).getByRole('textbox');
      await userEvent.type(input, 'angular{Enter}');

      expect(
        within(container).getByLabelText('Remove angular'),
      ).toBeTruthy();
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoChipsInput, {
        inputs: { ariaLabel: 'Tags' },
      });
      await expectNoA11yViolations(container);
    });
  });
});
