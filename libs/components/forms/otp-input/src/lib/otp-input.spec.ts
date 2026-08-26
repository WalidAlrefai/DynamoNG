import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoOtpInput } from './otp-input';
import { DynamoOtpInputHarness } from './otp-input.harness';

@Component({
  selector: 'dg-otp-input-reactive-form-host',
  standalone: true,
  imports: [DynamoOtpInput, ReactiveFormsModule],
  template: `<dg-otp-input [formControl]="control" ariaLabel="Verification code" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'dg-otp-input-ng-model-host',
  standalone: true,
  imports: [DynamoOtpInput, FormsModule],
  template: `<dg-otp-input [(ngModel)]="value" ariaLabel="Verification code" />`,
})
class NgModelHostComponent {
  value = '';
}

function boxes(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input'));
}

function box(container: HTMLElement, index: number): HTMLInputElement {
  const el = boxes(container)[index];
  if (!el) {
    throw new Error(`No box at index ${index}`);
  }
  return el;
}

function pasteEvent(text: string): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: () => text },
  });
  return event;
}

describe('DynamoOtpInput', () => {
  describe('creation', () => {
    it('renders `length` boxes in a role="group" wrapper', () => {
      const { container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });

      expect(within(container).getByRole('group')).toBeTruthy();
      expect(boxes(container)).toHaveLength(6);
    });
  });

  describe('default behavior', () => {
    it('defaults length to 6 with all boxes empty', () => {
      const { container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });

      expect(boxes(container).map((b) => b.value)).toEqual([
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
    });
  });

  describe('user interactions', () => {
    it('typing a digit advances focus to the next box', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      const first = box(container, 0);

      first.value = '1';
      fireEvent.input(first);
      fixture.detectChanges();

      expect(document.activeElement).toBe(box(container, 1));
    });

    it('rejects a non-digit keystroke when numeric (default)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      const first = box(container, 0);

      first.value = 'a';
      fireEvent.input(first);
      fixture.detectChanges();

      expect(first.value).toBe('');
      expect(document.activeElement).not.toBe(box(container, 1));
    });

    it('accepts non-digit characters when numeric is false', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code', numeric: false },
      });
      const first = box(container, 0);

      first.value = 'a';
      fireEvent.input(first);
      fixture.detectChanges();

      expect(first.value).toBe('a');
    });

    it('clears and focuses the previous box on Backspace from an empty box', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      const first = box(container, 0);
      first.value = '1';
      fireEvent.input(first);
      fixture.detectChanges();
      const second = box(container, 1);

      fireEvent.keyDown(second, { key: 'Backspace' });
      fixture.detectChanges();

      expect(document.activeElement).toBe(first);
      expect(first.value).toBe('');
    });

    it('moves focus with ArrowLeft/ArrowRight without editing', () => {
      const { container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      const second = box(container, 1);
      second.focus();

      fireEvent.keyDown(second, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(box(container, 2));

      fireEvent.keyDown(box(container, 2), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(second);
    });

    it('splits a pasted code across boxes starting at the focused one', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      const first = box(container, 0);

      first.dispatchEvent(pasteEvent('123456'));
      fixture.detectChanges();

      expect(boxes(container).map((b) => b.value)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
    });

    it('strips non-digit characters from a paste when numeric (default)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      const first = box(container, 0);

      first.dispatchEvent(pasteEvent('12-34'));
      fixture.detectChanges();

      expect(boxes(container).map((b) => b.value)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '',
        '',
      ]);
    });

    it('supports interaction through the DynamoOtpInputHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoOtpInputHarness,
      );

      await harness.focusBox(0);
      await harness.typeInBox(0, '7');

      expect(await harness.getValue()).toBe('7');
    });
  });

  describe('output events', () => {
    it('propagates typed digits to a bound reactive FormControl', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const first = box(container, 0);
      first.value = '4';
      fireEvent.input(first);
      fixture.detectChanges();

      expect(componentInstance.control.value).toBe('4');
    });

    it('propagates typed digits to an [(ngModel)] binding', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        NgModelHostComponent,
      );
      const first = box(container, 0);
      first.value = '9';
      fireEvent.input(first);
      fixture.detectChanges();

      expect(componentInstance.value).toBe('9');
    });
  });

  describe('state changes', () => {
    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue('4242');
      fixture.detectChanges();

      expect(boxes(container).map((b) => b.value)).toEqual([
        '4',
        '2',
        '4',
        '2',
        '',
        '',
      ]);
    });

    it('marks the FormControl as touched on blur', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);

      fireEvent.blur(box(container, 0));
      fixture.detectChanges();

      expect(componentInstance.control.touched).toBe(true);
    });

    it('disables every box when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(boxes(container).every((b) => b.disabled)).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('gives each box a "Digit N of M" aria-label', () => {
      const { container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code', length: 4 },
      });

      expect(box(container, 0).getAttribute('aria-label')).toBe(
        'Digit 1 of 4',
      );
      expect(box(container, 3).getAttribute('aria-label')).toBe(
        'Digit 4 of 4',
      );
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code' },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('works with a length of 1', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code', length: 1 },
      });
      expect(boxes(container)).toHaveLength(1);

      const first = box(container, 0);
      first.value = '5';
      fireEvent.input(first);
      fixture.detectChanges();

      expect(first.value).toBe('5');
    });

    it('clamps a paste with more characters than remaining boxes', () => {
      const { fixture, container } = renderDynamoComponent(DynamoOtpInput, {
        inputs: { ariaLabel: 'Verification code', length: 3 },
      });

      box(container, 0).dispatchEvent(pasteEvent('123456'));
      fixture.detectChanges();

      expect(boxes(container).map((b) => b.value)).toEqual(['1', '2', '3']);
    });
  });
});
