import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamoDatePicker } from './date-picker';
import { DynamoDatePickerHarness } from './date-picker.harness';

// Fixed "today" for every test — a plain midweek Wednesday, not on any
// tested min/max boundary. All hardcoded month/day expectations below are
// derived from this date.
const TODAY = new Date(2026, 7, 19);

function formatMedium(date: Date): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

// The CDK overlay portals `role="dialog"` content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container` element —
// same reasoning as DynamoMenu's spec.
function getDialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

function getDayButtons(): HTMLButtonElement[] {
  return Array.from(
    getDialog()?.querySelectorAll('table[role="grid"] button') ?? [],
  );
}

function getDayButtonByText(text: string): HTMLButtonElement {
  const button = getDayButtons().find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!button) throw new Error(`No day button with text "${text}" found`);
  return button;
}

// The open()-driven overlay attach/detach effect runs via Angular's zoneless
// effect scheduler, not synchronously with the signal write that triggered
// it — flushing a real setTimeout(0) plus detectChanges() is needed before
// asserting on the result, same technique as DynamoMenu's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-date-picker-test-host',
  standalone: true,
  imports: [DynamoDatePicker],
  template: `
    <dg-date-picker
      [(value)]="value"
      [(open)]="isOpen"
      [min]="min()"
      [max]="max()"
      ariaLabel="Choose a date"
      placeholder="Choose a date"
    />
  `,
})
class DatePickerTestHostComponent {
  readonly value = model<Date | null>(null);
  readonly isOpen = model(false);
  readonly min = signal<Date | undefined>(undefined);
  readonly max = signal<Date | undefined>(undefined);
}

@Component({
  selector: 'dg-date-picker-reactive-form-host',
  standalone: true,
  imports: [DynamoDatePicker, ReactiveFormsModule],
  template: `<dg-date-picker
    [formControl]="control"
    ariaLabel="Choose a date"
  />`,
})
class DatePickerReactiveFormHostComponent {
  readonly control = new FormControl<Date | null>(null);
}

describe('DynamoDatePicker', () => {
  beforeEach(() => {
    // Only fake `Date` — `settle()` below relies on a real `setTimeout` to
    // flush the zoneless overlay-attach effect, which a full
    // `vi.useFakeTimers()` would also intercept and hang forever.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('creation', () => {
    it('renders a trigger button with the placeholder text', () => {
      const { container } = renderDynamoComponent(DatePickerTestHostComponent);

      expect(
        within(container).getByRole('button', { name: 'Choose a date' }),
      ).toBeTruthy();
    });

    it('does not render a dialog before any interaction', () => {
      renderDynamoComponent(DatePickerTestHostComponent);

      expect(getDialog()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to closed, not disabled, size "md"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDatePicker);

      expect(componentInstance.open()).toBe(false);
      expect(componentInstance.disabled()).toBe(false);
      expect(componentInstance.size()).toBe('md');
    });

    it('shows the placeholder text when no value is set', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { placeholder: 'Pick a day' },
      });

      expect(within(container).getByRole('button').textContent?.trim()).toBe(
        'Pick a day',
      );
    });
  });

  describe('input properties', () => {
    it('reflects a set value as formatted trigger text', () => {
      const { componentInstance, container: bareContainer } =
        renderDynamoComponent(DynamoDatePicker, {
          inputs: { value: new Date(2026, 7, 19) },
        });

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19));
      expect(
        within(bareContainer).getByRole('button').textContent?.trim(),
      ).toBe(formatMedium(new Date(2026, 7, 19)));
    });

    it('disables the trigger when disabled is true', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { disabled: true },
      });

      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it.each(['sm', 'md', 'lg'] as const)(
      'accepts size "%s" without throwing',
      (size) => {
        expect(() =>
          renderDynamoComponent(DynamoDatePicker, { inputs: { size } }),
        ).not.toThrow();
      },
    );
  });

  describe('output events', () => {
    it('updates the bound [(value)] model when a day is selected', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const day = getDayButtonByText('19');
      await userEvent.click(day);
      await settle(fixture);

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19));
    });

    it('updates the bound [(open)] model as the panel opens and closes', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });

      await userEvent.click(trigger);
      await settle(fixture);
      expect(componentInstance.isOpen()).toBe(true);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);
      expect(componentInstance.isOpen()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('opens the dialog when the trigger is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()).not.toBeNull();
    });

    it.each(['{ArrowDown}', '{Enter}', ' '])(
      'opens the dialog on "%s" at the trigger',
      async (key) => {
        const { container, fixture } = renderDynamoComponent(
          DatePickerTestHostComponent,
        );
        const trigger = within(container).getByRole('button', {
          name: 'Choose a date',
        });
        trigger.focus();

        await userEvent.keyboard(key);
        await settle(fixture);

        expect(getDialog()).not.toBeNull();
      },
    );

    it('focuses today by default when opened with no value', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(document.activeElement?.textContent?.trim()).toBe('19');
    });

    it('selects a day, closes, commits the value, and refocuses the trigger', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19));
      expect(getDialog()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('closes without changing the value and refocuses the trigger on Escape', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
      expect(getDialog()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getDialog()).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getDialog()).toBeNull();
    });

    it.each([
      ['{ArrowRight}', '20'],
      ['{ArrowLeft}', '18'],
      ['{ArrowDown}', '26'],
      ['{ArrowUp}', '12'],
      ['{Home}', '16'],
      ['{End}', '22'],
    ])('moves focus with %s to day %s', async (key, expectedDay) => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard(key);

      expect(document.activeElement?.textContent?.trim()).toBe(expectedDay);
    });

    it('moves to the previous/next month on PageUp/PageDown', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getDialog()?.textContent).toContain('August 2026');

      await userEvent.keyboard('{PageUp}');
      expect(getDialog()?.textContent).toContain('July 2026');

      await userEvent.keyboard('{PageDown}{PageDown}');
      expect(getDialog()?.textContent).toContain('September 2026');
    });

    it('moves to the previous/next year on Shift+PageUp/PageDown', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard('{Shift>}{PageUp}{/Shift}');
      expect(getDialog()?.textContent).toContain('August 2025');

      await userEvent.keyboard(
        '{Shift>}{PageDown}{/Shift}{Shift>}{PageDown}{/Shift}',
      );
      expect(getDialog()?.textContent).toContain('August 2027');
    });

    it('moves focus into the grid when the header nav buttons are clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const prevButton = within(getDialog() as HTMLElement).getByRole(
        'button',
        {
          name: 'Previous month',
        },
      );
      await userEvent.click(prevButton);
      await settle(fixture);

      expect(getDialog()?.textContent).toContain('July 2026');
      expect(document.activeElement?.textContent?.trim()).toBe('19');
      expect(getDayButtons()).toContain(document.activeElement);
    });

    it('clamps arrow-key navigation at the min boundary', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      componentInstance.min.set(new Date(2026, 7, 15));
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard(
        '{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}',
      );
      expect(document.activeElement?.textContent?.trim()).toBe('15');

      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement?.textContent?.trim()).toBe('15');
    });

    it('clamps arrow-key navigation at the max boundary', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      componentInstance.max.set(new Date(2026, 7, 20));
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement?.textContent?.trim()).toBe('20');

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement?.textContent?.trim()).toBe('20');
    });

    it('does nothing when a disabled day is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      componentInstance.max.set(new Date(2026, 7, 15));
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const disabledDay = getDayButtonByText('20');
      expect(disabledDay.disabled).toBe(true);
      await userEvent.click(disabledDay);
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
      expect(getDialog()).not.toBeNull();
    });

    it('supports interaction through the DynamoDatePickerHarness', async () => {
      const { fixture } = renderDynamoComponent(DatePickerTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoDatePickerHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      expect(await harness.getTriggerText()).toBe('Choose a date');

      await harness.selectDayByLabel('19');
      await settle(fixture);

      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('conditional rendering', () => {
    it('renders exactly 42 day buttons while open', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDayButtons()).toHaveLength(42);
    });

    it('only mounts the dialog while open', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });

      expect(getDialog()).toBeNull();
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getDialog()).not.toBeNull();
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getDialog()).toBeNull();
    });
  });

  describe('template behavior', () => {
    it('reflects aria-expanded and aria-controls on the trigger based on open state', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBeNull();

      await userEvent.click(trigger);
      await settle(fixture);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(trigger.getAttribute('aria-controls')).toBe(getDialog()?.id);
    });

    it('marks only today\'s cell with aria-current="date"', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const current = getDialog()?.querySelectorAll('[aria-current="date"]');
      expect(current).toHaveLength(1);
      expect(current?.[0]?.textContent?.trim()).toBe('19');
    });

    it('marks only the selected cell with aria-selected', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      componentInstance.value.set(new Date(2026, 7, 19));
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const selectedCells = getDialog()?.querySelectorAll(
        '[role="gridcell"][aria-selected="true"]',
      );
      expect(selectedCells).toHaveLength(1);
      expect(selectedCells?.[0]?.textContent?.trim()).toBe('19');
    });

    it('renders exactly 7 weekday column headers', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(
        getDialog()?.querySelectorAll('[role="columnheader"]'),
      ).toHaveLength(7);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its closed state', async () => {
      const { container } = renderDynamoComponent(DatePickerTestHostComponent);

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations while the dialog is open', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('state changes', () => {
    it('updates the trigger label after an external value change (writeValue)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoDatePicker);

      fixture.componentInstance.writeValue(new Date(2026, 7, 19));
      fixture.detectChanges();

      expect(within(container).getByRole('button').textContent?.trim()).toBe(
        formatMedium(new Date(2026, 7, 19)),
      );
    });

    it('propagates a selection to a bound reactive FormControl (registerOnChange)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerReactiveFormHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);

      expect(componentInstance.control.value).toEqual(new Date(2026, 7, 19));
    });

    it('marks the bound FormControl as touched when the dialog closes (registerOnTouched)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(componentInstance.control.touched).toBe(true);
    });

    it('disables the trigger when the bound FormControl is disabled (setDisabledState)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DatePickerReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close toggling without throwing', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });

      for (let i = 0; i < 5; i++) {
        await userEvent.click(trigger);
        await userEvent.click(trigger);
      }
      await settle(fixture);

      expect(true).toBe(true);
    });

    it('does not throw when min is after max', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      componentInstance.min.set(new Date(2026, 7, 25));
      componentInstance.max.set(new Date(2026, 7, 10));
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()).not.toBeNull();
    });
  });
});
