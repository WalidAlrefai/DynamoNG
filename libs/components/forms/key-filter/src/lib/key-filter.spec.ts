import { Component, signal } from '@angular/core';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoKeyFilter } from './key-filter';
import type { DynamoKeyFilterPattern } from './key-filter.types';

@Component({
  selector: 'dg-key-filter-host',
  standalone: true,
  imports: [DynamoKeyFilter],
  template: `
    <input [dgKeyFilter]="pattern()" aria-label="Filtered" data-testid="field" />
  `,
})
class KeyFilterHostComponent {
  readonly pattern = signal<DynamoKeyFilterPattern>('int');
}

function field(container: HTMLElement): HTMLInputElement {
  return within(container).getByTestId('field') as HTMLInputElement;
}

describe('DynamoKeyFilter', () => {
  describe('presets', () => {
    it('int: allows a leading minus and digits, blocks letters and dots', async () => {
      const { container } = renderDynamoComponent(KeyFilterHostComponent);
      const input = field(container);
      input.focus();

      await userEvent.type(input, '-12a3.4');
      // 'a' and '.' are rejected; the digits all pass.
      expect(input.value).toBe('-1234');
    });

    it('money: allows up to two decimals, blocks a third', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        KeyFilterHostComponent,
      );
      componentInstance.pattern.set('money');
      fixture.detectChanges();
      const input = field(container);
      input.focus();

      await userEvent.type(input, '12.345');
      expect(input.value).toBe('12.34');
    });

    it('hex: allows 0-9a-f in any case, blocks g', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        KeyFilterHostComponent,
      );
      componentInstance.pattern.set('hex');
      fixture.detectChanges();
      const input = field(container);
      input.focus();

      await userEvent.type(input, 'D3adG0');
      expect(input.value).toBe('D3ad0');
    });

    it('alpha: blocks digits', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        KeyFilterHostComponent,
      );
      componentInstance.pattern.set('alpha');
      fixture.detectChanges();
      const input = field(container);
      input.focus();

      await userEvent.type(input, 'ab12cd');
      expect(input.value).toBe('abcd');
    });
  });

  describe('custom RegExp', () => {
    it('honours a RegExp pattern', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        KeyFilterHostComponent,
      );
      componentInstance.pattern.set(/^[ab]*$/);
      fixture.detectChanges();
      const input = field(container);
      input.focus();

      await userEvent.type(input, 'abcab');
      expect(input.value).toBe('abab');
    });
  });

  describe('editing keys', () => {
    it('lets Backspace and arrow keys through', async () => {
      const { container } = renderDynamoComponent(KeyFilterHostComponent);
      const input = field(container);
      input.focus();

      await userEvent.type(input, '123');
      await userEvent.keyboard('{Backspace}{Backspace}');
      expect(input.value).toBe('1');
    });
  });

  describe('paste', () => {
    it('blocks a paste whose result fails the pattern', () => {
      const { container } = renderDynamoComponent(KeyFilterHostComponent);
      const input = field(container);

      const event = new Event('paste', {
        bubbles: true,
        cancelable: true,
      }) as ClipboardEvent;
      Object.defineProperty(event, 'clipboardData', {
        value: { getData: () => 'abc' },
      });
      input.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('allows a paste whose result passes the pattern', () => {
      const { container } = renderDynamoComponent(KeyFilterHostComponent);
      const input = field(container);

      const event = new Event('paste', {
        bubbles: true,
        cancelable: true,
      }) as ClipboardEvent;
      Object.defineProperty(event, 'clipboardData', {
        value: { getData: () => '-42' },
      });
      input.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(KeyFilterHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
