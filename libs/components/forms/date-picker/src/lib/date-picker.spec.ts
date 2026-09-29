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
import { formatDate, inferFormatFromLocale } from './date-picker-format';
import { DynamoDatePickerHarness } from './date-picker.harness';

// Fixed "today" for every test — a plain midweek Wednesday, not on any
// tested min/max boundary. All hardcoded month/day expectations below are
// derived from this date.
const TODAY = new Date(2026, 7, 19);

function formatMedium(date: Date): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

// The trigger's date-only (non-showTime) display/typed text uses the
// locale-inferred short token format (via `activeFormatParts`), not the
// spelled-out `formatMedium` style above — computed the same way the
// component does, rather than hardcoded, to avoid ICU-version brittleness.
function formatShort(date: Date): string {
  return formatDate(date, inferFormatFromLocale('en'));
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

// Opens the panel via ArrowDown at the trigger rather than a click — unlike
// a click (which deliberately leaves focus on the input so typing stays
// possible right after clicking in, see `onTriggerClick`'s doc comment), a
// keyboard open moves focus into the day grid, same as before Phase 1. Tests
// that assert on grid roving focus need this, not a click-to-open.
async function openViaKeyboard(
  trigger: HTMLElement,
  fixture: ComponentFixture<unknown>,
): Promise<void> {
  trigger.focus();
  await userEvent.keyboard('{ArrowDown}');
  await settle(fixture);
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

@Component({
  selector: 'dg-date-picker-multi-test-host',
  standalone: true,
  imports: [DynamoDatePicker],
  template: `
    <dg-date-picker
      selectionMode="multiple"
      [(values)]="values"
      [(open)]="isOpen"
      ariaLabel="Choose dates"
      placeholder="Choose dates"
    />
  `,
})
class DatePickerMultiTestHostComponent {
  readonly values = model<Date[]>([]);
  readonly isOpen = model(false);
}

@Component({
  selector: 'dg-date-picker-multi-reactive-form-host',
  standalone: true,
  imports: [DynamoDatePicker, ReactiveFormsModule],
  template: `<dg-date-picker
    selectionMode="multiple"
    [formControl]="control"
    ariaLabel="Choose dates"
  />`,
})
class DatePickerMultiReactiveFormHostComponent {
  readonly control = new FormControl<Date[]>([]);
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
        within(container).getByRole('combobox', { name: 'Choose a date' }),
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

      expect(within(container).getByPlaceholderText('Pick a day')).toBeTruthy();
      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).value,
      ).toBe('');
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
        (within(bareContainer).getByRole('combobox') as HTMLInputElement).value,
      ).toBe(formatShort(new Date(2026, 7, 19)));
    });

    it('disables the trigger when disabled is true', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { disabled: true },
      });

      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).disabled,
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

  describe('typable input / format / mask', () => {
    it('is a real textbox with no value when empty, and shows typed text live without committing', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { ariaLabel: 'Choose a date' } },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      await userEvent.type(trigger, '08');

      expect(trigger.value).toBe('08');
      expect(componentInstance.value()).toBeNull();
    });

    it('commits a valid typed date on Enter, closes the panel, and clears the draft', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { ariaLabel: 'Choose a date' } },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      await userEvent.type(trigger, formatShort(new Date(2026, 7, 19)));
      await userEvent.keyboard('{Enter}');

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19));
      expect(getDialog()).toBeNull();
    });

    it('leaves an invalid typed draft untouched on Enter (no commit)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { ariaLabel: 'Choose a date' } },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      await userEvent.type(trigger, 'not a date');
      await userEvent.keyboard('{Enter}');

      expect(componentInstance.value()).toBeNull();
      expect(trigger.value).toBe('not a date');
    });

    it('commits a valid typed date on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { ariaLabel: 'Choose a date' } },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      await userEvent.type(trigger, formatShort(new Date(2026, 7, 19)));
      await userEvent.tab();

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19));
    });

    it('reverts an invalid typed draft to the canonical formatted value on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 19),
          },
        },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      await userEvent.clear(trigger);
      await userEvent.type(trigger, 'garbage');
      await userEvent.tab();

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19));
      expect(trigger.value).toBe(formatShort(new Date(2026, 7, 19)));
    });

    it('formats and parses against an explicit dateFormat', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            ariaLabel: 'Choose a date',
            dateFormat: 'yyyy-mm-dd',
            value: new Date(2026, 7, 19),
          },
        },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;
      expect(trigger.value).toBe('2026-08-19');

      await userEvent.clear(trigger);
      await userEvent.type(trigger, '2027-01-05');
      await userEvent.tab();

      expect(componentInstance.value()).toEqual(new Date(2027, 0, 5));
    });

    it('applies a digit mask as the user types a fixed-width format', async () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          dateFormat: 'mm/dd/yyyy',
          mask: true,
        },
      });
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      await userEvent.type(trigger, '08192026');

      expect(trigger.value).toBe('08/19/2026');
    });

    it('forces the input read-only-for-typing while showTime is on (v1 scope cut)', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', showTime: true },
      });
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      expect(trigger.readOnly).toBe(true);
    });

    it('clicking the input to open the panel keeps focus on the input, not the day grid (so typing stays possible)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()).not.toBeNull();
      expect(document.activeElement).toBe(trigger);

      await userEvent.type(trigger, '08');
      expect(trigger.value).toBe('08');
    });
  });

  describe('passthrough (pt)', () => {
    it('merges pt.root attrs onto the trigger wrapper and pt.trigger class onto the trigger button', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          pt: {
            root: { 'data-testid': 'root-el' },
            trigger: { class: 'ring-2' },
          },
        },
      });

      expect(container.querySelector('[data-testid="root-el"]')).not.toBeNull();
      // pt.trigger targets the wrapper div (border/bg/focus-ring box), not
      // the combobox `<input>` itself, which only carries layout-reset
      // classes — same wrapper/inner split `@dynamong/select`'s trigger uses.
      expect(
        within(container).getByRole('combobox').parentElement?.className,
      ).toContain('ring-2');
    });

    it('merges pt.panel class onto the dialog and pt.day class onto every day button', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          pt: { panel: { class: 'panel-pt' }, day: { class: 'day-pt' } },
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()?.className).toContain('panel-pt');
      expect(getDayButtonByText('19').className).toContain('day-pt');
    });

    it('merges pt.time-field class onto the time steppers and pt.apply-button class onto Apply', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          showTime: true,
          pt: {
            'time-field': { class: 'time-field-pt' },
            'apply-button': { class: 'apply-pt' },
          },
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      const dialog = getDialog();
      expect(dialog?.querySelector('[role="spinbutton"]')?.className).toContain(
        'time-field-pt',
      );
      expect(
        within(dialog as HTMLElement).getByRole('button', { name: 'Apply' })
          .className,
      ).toContain('apply-pt');
    });
  });

  describe('variant / fluid', () => {
    it('applies w-full and bg-surface-0 by default', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker);
      const className =
        within(container).getByRole('combobox').parentElement?.className ?? '';
      expect(className).toContain('w-full');
      expect(className).toContain('bg-surface-0');
    });

    it('drops w-full when fluid is false', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { fluid: false },
      });
      expect(
        within(container).getByRole('combobox').parentElement?.className,
      ).not.toContain('w-full');
    });

    it('applies filled background and drops the outlined background when variant is filled', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { variant: 'filled' },
      });
      const className =
        within(container).getByRole('combobox').parentElement?.className ?? '';
      expect(className).toContain('bg-surface-100');
      expect(className).not.toContain('bg-surface-0');
    });
  });

  describe('ariaDescribedby', () => {
    it('reflects onto the trigger when set, and omits it otherwise', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoDatePicker);
      expect(
        within(container)
          .getByRole('combobox')
          .getAttribute('aria-describedby'),
      ).toBeNull();

      setInputs({ ariaDescribedby: 'date-help' });
      expect(
        within(container)
          .getByRole('combobox')
          .getAttribute('aria-describedby'),
      ).toBe('date-help');
    });
  });

  describe('locale', () => {
    it('overrides the injected config locale for the formatted trigger text', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { value: new Date(2026, 7, 19), locale: 'en-GB' },
      });

      const expected = formatDate(
        new Date(2026, 7, 19),
        inferFormatFromLocale('en-GB'),
      );
      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).value,
      ).toBe(expected);
    });
  });

  describe('output events', () => {
    it('updates the bound [(value)] model when a day is selected', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()).not.toBeNull();
    });

    // No ' ' case any more — the trigger is a real textbox now, so Space
    // types a literal space instead of opening the panel (intentional
    // behavior change, see onTriggerKeydown's doc comment).
    it.each(['{ArrowDown}', '{Enter}'])(
      'opens the dialog on "%s" at the trigger',
      async (key) => {
        const { container, fixture } = renderDynamoComponent(
          DatePickerTestHostComponent,
        );
        const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await openViaKeyboard(trigger, fixture);

      expect(document.activeElement?.textContent?.trim()).toBe('19');
    });

    it('selects a day, closes, commits the value, and refocuses the trigger', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await openViaKeyboard(trigger, fixture);

      await userEvent.keyboard(key);

      expect(document.activeElement?.textContent?.trim()).toBe(expectedDay);
    });

    it('moves to the previous/next month on PageUp/PageDown', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await openViaKeyboard(trigger, fixture);
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await openViaKeyboard(trigger, fixture);

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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await openViaKeyboard(trigger, fixture);

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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await openViaKeyboard(trigger, fixture);

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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });

      expect(getDialog()).toBeNull();
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getDialog()).not.toBeNull();

      // A second click on the input itself does NOT close it (unlike the
      // old button's toggle-on-click) — clicking back into the field to fix
      // a typo shouldn't snap the calendar shut. Escape is the input's own
      // explicit close path; the icon button's toggle() is the other.
      await userEvent.keyboard('{Escape}');
      await settle(fixture);
      expect(getDialog()).toBeNull();
    });
  });

  describe('template behavior', () => {
    it('reflects aria-expanded and aria-controls on the trigger based on open state', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(
        getDialog()?.querySelectorAll('[role="columnheader"]'),
      ).toHaveLength(7);
    });

    it('gives each day button a full formatted-date aria-label', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const day = getDayButtonByText('19');
      expect(day.getAttribute('aria-label')).toBe(
        new Intl.DateTimeFormat('en', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(2026, 7, 19)),
      );
    });

    it('announces the visible month via a live region on navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const liveRegion = getDialog()?.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('August 2026');

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Next month',
        }),
      );
      fixture.detectChanges();

      expect(liveRegion?.textContent).toBe('September 2026');
    });
  });

  describe('month/year quick-jump', () => {
    async function openQuickJump(
      container: HTMLElement,
      fixture: ComponentFixture<unknown>,
    ): Promise<void> {
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'August 2026',
        }),
      );
      fixture.detectChanges();
    }

    it('swaps the day grid for a 12-month grid when the header is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      await openQuickJump(container, fixture);

      expect(getDialog()?.querySelector('table[role="grid"]')).toBeNull();
      expect(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Aug',
        }),
      ).toBeTruthy();
    });

    it('jumps to the selected month and closes the quick-jump grid', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      await openQuickJump(container, fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Dec',
        }),
      );
      fixture.detectChanges();

      expect(getDialog()?.querySelector('table[role="grid"]')).toBeTruthy();
      expect(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'December 2026',
        }),
      ).toBeTruthy();
    });

    it('steps the quick-jump year independently of the visible month', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      await openQuickJump(container, fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Next year',
        }),
      );
      fixture.detectChanges();

      expect(within(getDialog() as HTMLElement).getByText('2027')).toBeTruthy();
    });

    it('disables a quick-jump month that falls entirely outside min/max', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          min: new Date(2026, 6, 1),
          max: new Date(2026, 8, 30),
        },
      });
      await openQuickJump(container, fixture);

      expect(
        (
          within(getDialog() as HTMLElement).getByRole('button', {
            name: 'Jun',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(getDialog() as HTMLElement).getByRole('button', {
            name: 'Aug',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    it('closes only the quick-jump grid on the first Escape, then the panel on the second', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      await openQuickJump(container, fixture);

      await userEvent.keyboard('{Escape}');
      fixture.detectChanges();
      expect(getDialog()?.querySelector('table[role="grid"]')).toBeTruthy();

      await userEvent.keyboard('{Escape}');
      await settle(fixture);
      expect(getDialog()).toBeNull();
    });
  });

  describe('view: "month"', () => {
    it('renders a 12-month grid instead of the day table, with no Previous/Next month toggle', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', view: 'month' },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      const dialog = getDialog() as HTMLElement;
      expect(dialog.querySelector('table[role="grid"]')).toBeNull();
      expect(
        within(dialog).queryByRole('button', { name: 'Previous month' }),
      ).toBeNull();
      expect(within(dialog).getByText('Aug')).toBeTruthy();
    });

    it('is read-only-for-typing (no format/mask grammar built for month view)', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', view: 'month' },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).readOnly,
      ).toBe(true);
    });

    it('shows the month+year of the current value in the trigger', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          view: 'month',
          value: new Date(2026, 7, 19),
        },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).value,
      ).toBe('August 2026');
    });

    it('commits the first of the clicked month and closes the panel', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { ariaLabel: 'Choose a date', view: 'month' } },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByText('Dec'),
      );
      await settle(fixture);

      expect(componentInstance.value()).toEqual(new Date(2026, 11, 1));
      expect(getDialog()).toBeNull();
    });

    it('steps the header year with Previous/Next year, independent of navigating months', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', view: 'month' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      const dialog = getDialog() as HTMLElement;
      expect(dialog.textContent).toContain('2026');

      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Next year' }),
      );
      // Not `.toContain('2027')` — a December click target's own button text
      // could coincidentally overlap; check the specific header span instead.
      expect(dialog.querySelector('.text-sm.font-semibold')?.textContent).toBe(
        '2027',
      );
    });

    it('disables a month that falls entirely outside min/max', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          view: 'month',
          max: new Date(2026, 5, 30),
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(
        (
          within(getDialog() as HTMLElement).getByText(
            'Aug',
          ) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    it('has no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', view: 'month' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('view: "year"', () => {
    it('renders a 12-year grid instead of the day table', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          view: 'year',
          value: new Date(2026, 7, 19),
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      const dialog = getDialog() as HTMLElement;
      expect(dialog.querySelector('table[role="grid"]')).toBeNull();
      expect(within(dialog).getByText('2026')).toBeTruthy();
    });

    it('shows just the year of the current value in the trigger', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          view: 'year',
          value: new Date(2026, 7, 19),
        },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).value,
      ).toBe('2026');
    });

    it('commits January 1 of the clicked year and closes the panel', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            ariaLabel: 'Choose a date',
            view: 'year',
            value: new Date(2026, 7, 19),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      // 2016-2027 is the rendered block for a 2026 focusedDate
      // (floor(2026/12)*12 = 2016) — 2020 falls inside it.
      await userEvent.click(
        within(getDialog() as HTMLElement).getByText('2020'),
      );
      await settle(fixture);

      expect(componentInstance.value()).toEqual(new Date(2020, 0, 1));
      expect(getDialog()).toBeNull();
    });

    it('steps a full 12-year block with Previous/Next years', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          view: 'year',
          value: new Date(2026, 7, 19),
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      const dialog = getDialog() as HTMLElement;
      const label = () =>
        dialog.querySelector('.text-sm.font-semibold')?.textContent;
      const firstBlockLabel = label();
      expect(firstBlockLabel).toBe('2016 - 2027');

      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Next years' }),
      );

      expect(label()).toBe('2028 - 2039');
      expect(label()).not.toBe(firstBlockLabel);
    });

    it('disables a year that falls entirely outside min/max', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          view: 'year',
          value: new Date(2026, 7, 19),
          max: new Date(2026, 11, 31),
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(
        (
          within(getDialog() as HTMLElement).getByText(
            '2027',
          ) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    it('has no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', view: 'year' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('numberOfMonths', () => {
    it('renders a single grid with no per-grid label by default', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      const dialog = getDialog() as HTMLElement;
      expect(dialog.querySelectorAll('table[role="grid"]')).toHaveLength(1);
      expect(dialog.textContent).not.toContain('August 2026September 2026');
    });

    it('renders numberOfMonths grids side by side, each labeled with its own month', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', numberOfMonths: 2 },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      const dialog = getDialog() as HTMLElement;
      const tables = dialog.querySelectorAll('table[role="grid"]');
      expect(tables).toHaveLength(2);
      expect((tables[0] as HTMLElement).getAttribute('aria-label')).toBe(
        'August 2026',
      );
      expect((tables[1] as HTMLElement).getAttribute('aria-label')).toBe(
        'September 2026',
      );
      expect(getDayButtons()).toHaveLength(84);
    });

    it('dims a date as outsideMonth only in the grid it does not belong to', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', numberOfMonths: 2 },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      const tables = (getDialog() as HTMLElement).querySelectorAll(
        'table[role="grid"]',
      );
      const augustTable = tables[0] as HTMLElement;
      const septemberTable = tables[1] as HTMLElement;
      // August 1, 2026 is a Saturday, so August's own grid also shows
      // July 26-31 as leading (outsideMonth) days *before* August's real
      // dates — search from the end so this matches August's real 31, not
      // July's leading one (which the DOM sees first).
      const augustDay31 = Array.from(augustTable.querySelectorAll('button'))
        .reverse()
        .find((btn) => btn.textContent?.trim() === '31') as HTMLButtonElement;
      const septemberLeadingDay31 = Array.from(
        septemberTable.querySelectorAll('button'),
      ).find((btn) => btn.textContent?.trim() === '31') as HTMLButtonElement;

      // Aug 31 in August's own grid is a normal (non-dimmed) day...
      expect(augustDay31.className).not.toContain('text-text-muted');
      // ...but the same date leaking into September's leading row is dimmed
      // there, since it's outside *that* grid's own month.
      expect(septemberLeadingDay31.className).toContain('text-text-muted');
    });

    it('shifts the whole window by one month on Previous/Next, not by numberOfMonths', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', numberOfMonths: 2 },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Next month',
        }),
      );

      const tables = (getDialog() as HTMLElement).querySelectorAll(
        'table[role="grid"]',
      );
      expect((tables[0] as HTMLElement).getAttribute('aria-label')).toBe(
        'September 2026',
      );
      expect((tables[1] as HTMLElement).getAttribute('aria-label')).toBe(
        'October 2026',
      );
    });

    it('roving focus crossing a month boundary re-anchors the whole window and lands on the non-dimmed (owned) cell', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', numberOfMonths: 2 },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      // Today (Aug 19, 2026) + 7 + 7 = Sep 2 — outside August. `visibleMonth`
      // tracks `focusedDate` directly (same pre-existing single-month
      // behavior: the anchor follows the roving cursor), so the whole window
      // re-anchors to [September, October] rather than staying pinned at
      // [August, September] with focus merely "crossing into grid 2".
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');

      const allTables = (getDialog() as HTMLElement).querySelectorAll(
        'table[role="grid"]',
      );
      expect((allTables[0] as HTMLElement).getAttribute('aria-label')).toBe(
        'September 2026',
      );
      expect((allTables[1] as HTMLElement).getAttribute('aria-label')).toBe(
        'October 2026',
      );
      // Focus lands on the *owned* (non-dimmed) September 2 in the first
      // grid, not some dimmed spillover rendering.
      expect(document.activeElement?.textContent?.trim()).toBe('2');
      expect((document.activeElement as HTMLElement)?.className).not.toContain(
        'text-text-muted',
      );
      expect(
        (allTables[0] as HTMLElement).contains(document.activeElement),
      ).toBe(true);
    });

    it('respects max across every rendered grid', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          ariaLabel: 'Choose a date',
          numberOfMonths: 2,
          max: new Date(2026, 7, 25),
        },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      const septemberTable = (getDialog() as HTMLElement).querySelectorAll(
        'table[role="grid"]',
      )[1] as HTMLElement;
      const sep1 = Array.from(septemberTable.querySelectorAll('button')).find(
        (btn) => btn.textContent?.trim() === '1',
      ) as HTMLButtonElement;
      expect(sep1.disabled).toBe(true);
    });

    it('has no axe violations with multiple months', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { ariaLabel: 'Choose a date', numberOfMonths: 3 },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('readOnly', () => {
    it('still opens the dialog when the trigger is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { readOnly: true },
      });
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()).not.toBeNull();
    });

    it('still allows month navigation and arrow-key roving focus', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { readOnly: true },
      });
      const trigger = within(container).getByRole('combobox');
      await openViaKeyboard(trigger, fixture);
      expect(getDialog()?.textContent).toContain('August 2026');

      await userEvent.keyboard('{PageUp}');
      expect(getDialog()?.textContent).toContain('July 2026');

      await userEvent.keyboard('{ArrowRight}');
      expect(getDayButtons()).toContain(document.activeElement);
    });

    it('does not change the value or close the panel when a day is selected', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { readOnly: true } },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
      expect(getDialog()).not.toBeNull();
    });

    it('reflects aria-readonly on the trigger and keeps it focusable, not disabled', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { readOnly: true },
      });
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      expect(trigger.getAttribute('aria-readonly')).toBe('true');
      expect(trigger.disabled).toBe(false);
      expect(trigger.tabIndex).toBe(0);
    });
  });

  describe('clearable', () => {
    it('defaults to false, rendering no clear button even with a value set', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { value: TODAY } },
      );

      expect(componentInstance.clearable()).toBe(false);
      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });

    it('clears the value when the clear button is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { value: TODAY, clearable: true } },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );

      expect(componentInstance.value()).toBeNull();
    });

    it('does not render a clear button when nothing is selected, even if clearable', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { clearable: true },
      });

      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });
  });

  describe('disabledDates / disabledDays', () => {
    it('disables an exact date in disabledDates regardless of min/max', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { disabledDates: [new Date(2026, 7, 20)] },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDayButtonByText('20').disabled).toBe(true);
      expect(getDayButtonByText('21').disabled).toBe(false);
    });

    it('disables every weekday listed in disabledDays', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        // 2026-08-16 is a Sunday, 2026-08-22 is a Saturday.
        inputs: { disabledDays: [0, 6] },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDayButtonByText('16').disabled).toBe(true);
      expect(getDayButtonByText('22').disabled).toBe(true);
      expect(getDayButtonByText('19').disabled).toBe(false);
    });

    it('blocks clicking a disabledDates day from committing a value', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { disabledDates: [new Date(2026, 7, 20)] } },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      getDayButtonByText('20').click();
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
    });
  });

  describe('inline', () => {
    function getInlineDayButtons(container: HTMLElement): HTMLButtonElement[] {
      return Array.from(
        container.querySelectorAll('table[role="grid"] button'),
      );
    }

    it('renders the calendar directly with no trigger button or dialog role', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { inline: true },
      });

      expect(container.querySelector('[aria-haspopup="dialog"]')).toBeNull();
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(getInlineDayButtons(container).length).toBeGreaterThan(0);
    });

    it('shows the month containing the current value, not just today', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { inline: true, value: new Date(2026, 11, 25) },
      });

      expect(container.textContent).toContain('December 2026');
    });

    it('commits a day click directly, with no dialog to close', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { inline: true } },
      );
      const day19 = getInlineDayButtons(container).find(
        (btn) => btn.textContent?.trim() === '19',
      ) as HTMLButtonElement;

      day19.click();

      expect(componentInstance.value()).toEqual(TODAY);
    });

    it('does not steal focus from the page on mount', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();
      try {
        renderDynamoComponent(DynamoDatePicker, { inputs: { inline: true } });

        expect(document.activeElement).toBe(outside);
      } finally {
        outside.remove();
      }
    });

    it('only one day (the focused one) is a natural tab stop', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { inline: true },
      });

      const tabbable = getInlineDayButtons(container).filter(
        (btn) => btn.tabIndex === 0,
      );
      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]?.textContent?.trim()).toBe('19');
    });

    it('has no axe violations while inline', async () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { inline: true, ariaLabel: 'Choose a date' },
      });
      await expectNoA11yViolations(container);
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations with the quick-jump grid open', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'August 2026',
        }),
      );
      fixture.detectChanges();

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

      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).value,
      ).toBe(formatShort(new Date(2026, 7, 19)));
    });

    it('propagates a selection to a bound reactive FormControl (registerOnChange)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerReactiveFormHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
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
        (within(container).getByRole('combobox') as HTMLInputElement).disabled,
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close toggling without throwing', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
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
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()).not.toBeNull();
    });
  });

  describe('showTime', () => {
    function getSpinbutton(label: string): HTMLElement {
      const el = getDialog()?.querySelector(
        `[role="spinbutton"][aria-label="${label}"]`,
      );
      if (!el) throw new Error(`No spinbutton found for "${label}"`);
      return el as HTMLElement;
    }

    it('renders no time controls when showTime is unset (regression)', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()?.querySelector('[role="spinbutton"]')).toBeNull();
      expect(
        within(getDialog() as HTMLElement).queryByRole('button', {
          name: 'Apply',
        }),
      ).toBeNull();
    });

    it('selecting a day keeps the popup open and sets value to that day at the seeded time (midnight, no prior value)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { showTime: true, ariaLabel: 'Choose a date' } },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);

      expect(getDialog()).not.toBeNull();
      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19, 0, 0, 0));
    });

    it('seeds the steppers from an existing value when opened', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          showTime: true,
          ariaLabel: 'Choose a date',
          value: new Date(2026, 7, 19, 14, 37, 0),
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getSpinbutton('Hour').getAttribute('aria-valuenow')).toBe('14');
      expect(getSpinbutton('Minute').getAttribute('aria-valuenow')).toBe('37');
    });

    it('increments/decrements the hour, wrapping at the 24-hour boundary', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showTime: true,
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 19, 23, 0, 0),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Increment hour',
        }),
      );

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19, 0, 0, 0));
      expect(getSpinbutton('Hour').getAttribute('aria-valuenow')).toBe('0');
    });

    it('increments/decrements the minute, wrapping at the 60-minute boundary', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showTime: true,
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 19, 10, 0, 0),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Decrement minute',
        }),
      );

      // Each field wraps independently (no cross-field carry) — the hour
      // stays 10, only the minute wraps from 0 to 59.
      expect(componentInstance.value()).toEqual(
        new Date(2026, 7, 19, 10, 59, 0),
      );
    });

    it('hourFormat "12" displays 12 for hour 0, and the AM/PM toggle flips by 12 hours', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showTime: true,
            hourFormat: '12',
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 19, 0, 30, 0),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getSpinbutton('Hour').getAttribute('aria-valuetext')).toBe('12');
      const meridiemButton = within(getDialog() as HTMLElement).getByRole(
        'button',
        { name: 'AM' },
      );

      await userEvent.click(meridiemButton);

      expect(componentInstance.value()).toEqual(
        new Date(2026, 7, 19, 12, 30, 0),
      );
    });

    it('showSeconds renders a third stepper and preserves seconds on the committed value', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showTime: true,
            showSeconds: true,
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 19, 10, 0, 45),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getSpinbutton('Second').getAttribute('aria-valuenow')).toBe('45');

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Increment second',
        }),
      );

      expect(componentInstance.value()).toEqual(
        new Date(2026, 7, 19, 10, 0, 46),
      );
    });

    it('zeroes out seconds on the committed value when showSeconds is off', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showTime: true,
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 19, 10, 0, 45),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Increment minute',
        }),
      );

      expect(componentInstance.value()).toEqual(
        new Date(2026, 7, 19, 10, 1, 0),
      );
    });

    it('clicking Apply closes the popup and refocuses the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { showTime: true, ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Apply',
        }),
      );
      await settle(fixture);

      expect(getDialog()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('readOnly blocks the time steppers from changing the value', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showTime: true,
            readOnly: true,
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 19, 10, 0, 0),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Increment hour',
        }),
      );

      expect(componentInstance.value()).toEqual(
        new Date(2026, 7, 19, 10, 0, 0),
      );
    });

    it('includes a formatted time segment in the trigger label', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          showTime: true,
          ariaLabel: 'Choose a date',
          value: new Date(2026, 7, 19, 14, 5, 0),
        },
      });

      const label = (
        within(container).getByRole('combobox') as HTMLInputElement
      ).value;
      expect(label).toContain(formatMedium(new Date(2026, 7, 19)));
      expect(label).toMatch(/2:05\s*PM|14:05/);
    });

    it('inline mode renders working time steppers with no Apply button', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showTime: true,
            inline: true,
            value: new Date(2026, 7, 19, 10, 0, 0),
          },
        },
      );

      expect(
        within(container).queryByRole('button', { name: 'Apply' }),
      ).toBeNull();

      await userEvent.click(
        within(container).getByRole('button', { name: 'Increment hour' }),
      );

      expect(componentInstance.value()).toEqual(
        new Date(2026, 7, 19, 11, 0, 0),
      );
    });

    it('has no axe violations with showTime', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { showTime: true, ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations with showTime, hourFormat "12", and showSeconds', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          showTime: true,
          hourFormat: '12',
          showSeconds: true,
          ariaLabel: 'Choose a date',
        },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('supports getTimeValue/stepTime through the DynamoDatePickerHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          showTime: true,
          ariaLabel: 'Choose a date',
          value: new Date(2026, 7, 19, 10, 0, 0),
        },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoDatePickerHarness,
      );
      await harness.open();
      await settle(fixture);

      expect(await harness.getTimeValue()).toEqual({
        hours: 10,
        minutes: 0,
        seconds: null,
      });

      await harness.stepTime('hour', 'up');

      expect((await harness.getTimeValue())?.hours).toBe(11);
    });
  });

  describe('showButtonBar', () => {
    it('renders no Today/Clear buttons when unset (regression)', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose a date',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(
        within(getDialog() as HTMLElement).queryByRole('button', {
          name: 'Today',
        }),
      ).toBeNull();
      expect(
        within(getDialog() as HTMLElement).queryByRole('button', {
          name: 'Clear',
        }),
      ).toBeNull();
    });

    it('renders Today and Clear buttons when true', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { showButtonBar: true, ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Today',
        }),
      ).toBeTruthy();
      expect(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Clear',
        }),
      ).toBeTruthy();
    });

    it('clicking Today sets value to today and closes the popup', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { showButtonBar: true, ariaLabel: 'Choose a date' } },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Today',
        }),
      );
      await settle(fixture);

      expect(componentInstance.value()).toEqual(TODAY);
      expect(getDialog()).toBeNull();
    });

    it('clicking Today clamps to max when today falls outside the allowed range', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showButtonBar: true,
            ariaLabel: 'Choose a date',
            max: new Date(2026, 7, 10),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Today',
        }),
      );
      await settle(fixture);

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 10));
    });

    it('clicking Today is a no-op when readOnly is true', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showButtonBar: true,
            readOnly: true,
            ariaLabel: 'Choose a date',
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Today',
        }),
      );
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
    });

    it('clicking Clear clears an existing value and keeps the popup open', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            showButtonBar: true,
            ariaLabel: 'Choose a date',
            value: new Date(2026, 7, 5),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Clear',
        }),
      );
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
      expect(getDialog()).not.toBeNull();
    });

    it('disables the Today/Clear buttons when disabled is true', async () => {
      const { fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          showButtonBar: true,
          inline: true,
          ariaLabel: 'Choose a date',
          disabled: true,
        },
      });
      await settle(fixture);

      const dialog = fixture.nativeElement as HTMLElement;
      expect(
        (
          within(dialog).getByRole('button', {
            name: 'Today',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(dialog).getByRole('button', {
            name: 'Clear',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    it('has no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { showButtonBar: true, ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('selectionMode: "multiple"', () => {
    it('toggles a day in and out of [(values)], keeping the panel open both times', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerMultiTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose dates',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);
      expect(componentInstance.values()).toEqual([new Date(2026, 7, 19)]);
      expect(getDialog()).not.toBeNull();

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);
      expect(componentInstance.values()).toEqual([]);
      expect(getDialog()).not.toBeNull();
    });

    it('accumulates multiple non-adjacent days in ascending order regardless of click order', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerMultiTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose dates',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);
      await userEvent.click(getDayButtonByText('5'));
      await settle(fixture);

      expect(componentInstance.values()).toEqual([
        new Date(2026, 7, 5),
        new Date(2026, 7, 19),
      ]);
    });

    it('reflects multi-selection via aria-selected on the day cells', async () => {
      const { container, fixture } = renderDynamoComponent(
        DatePickerMultiTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox', {
        name: 'Choose dates',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getDayButtonByText('19'));
      await settle(fixture);

      expect(
        getDayButtonByText('19').closest('td')?.getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('shows an empty trigger with 0 selected, a comma-joined list with 1-2 selected, and a count with 3+', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerMultiTestHostComponent,
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;
      expect(trigger.value).toBe('');

      componentInstance.values.set([new Date(2026, 7, 5)]);
      fixture.detectChanges();
      expect(trigger.value).toBe(formatShort(new Date(2026, 7, 5)));

      componentInstance.values.set([
        new Date(2026, 7, 5),
        new Date(2026, 7, 19),
      ]);
      fixture.detectChanges();
      expect(trigger.value).toBe(
        `${formatShort(new Date(2026, 7, 5))}, ${formatShort(new Date(2026, 7, 19))}`,
      );

      componentInstance.values.set([
        new Date(2026, 7, 1),
        new Date(2026, 7, 5),
        new Date(2026, 7, 19),
      ]);
      fixture.detectChanges();
      expect(trigger.value).toBe('3 dates selected');
    });

    it('the trigger stays read-only for typing', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { selectionMode: 'multiple', ariaLabel: 'Choose dates' },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).readOnly,
      ).toBe(true);
    });

    it('shows the clear button once any date is selected, keyed off values().length', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          selectionMode: 'multiple',
          clearable: true,
          ariaLabel: 'Choose dates',
          values: [],
        },
      });
      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();

      setInputs({ values: [new Date(2026, 7, 19)] });
      expect(
        within(container).getByRole('button', { name: 'Clear selection' }),
      ).toBeTruthy();
    });

    it('the clear button empties values() instead of touching value()', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            selectionMode: 'multiple',
            clearable: true,
            ariaLabel: 'Choose dates',
            values: [new Date(2026, 7, 5), new Date(2026, 7, 19)],
          },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );

      expect(componentInstance.values()).toEqual([]);
    });

    it('"Today" adds today if absent and is a no-op if already selected (not a toggle)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            selectionMode: 'multiple',
            showButtonBar: true,
            ariaLabel: 'Choose dates',
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      const todayButton = () =>
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Today',
        });

      await userEvent.click(todayButton());
      await settle(fixture);
      expect(componentInstance.values()).toEqual([TODAY]);

      await userEvent.click(todayButton());
      await settle(fixture);
      expect(componentInstance.values()).toEqual([TODAY]);
    });

    it('round-trips an array value through writeValue/registerOnChange via a reactive FormControl', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DatePickerMultiReactiveFormHostComponent,
      );
      componentInstance.control.setValue([new Date(2026, 7, 19)]);
      fixture.detectChanges();

      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).value,
      ).toBe(formatShort(new Date(2026, 7, 19)));

      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.click(getDayButtonByText('5'));
      await settle(fixture);

      expect(componentInstance.control.value).toEqual([
        new Date(2026, 7, 5),
        new Date(2026, 7, 19),
      ]);
    });

    it('has no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { selectionMode: 'multiple', ariaLabel: 'Choose dates' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('view: "time"', () => {
    function getSpinbutton(label: string): HTMLElement {
      const el = getDialog()?.querySelector(
        `[role="spinbutton"][aria-label="${label}"]`,
      );
      if (!el) throw new Error(`No spinbutton found for "${label}"`);
      return el as HTMLElement;
    }

    it('renders only the time steppers and an Apply button — no calendar grid or header', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { view: 'time', ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      const dialog = getDialog() as HTMLElement;
      expect(dialog.querySelector('table[role="grid"]')).toBeNull();
      expect(dialog.querySelector('[role="spinbutton"]')).not.toBeNull();
      expect(
        within(dialog).getByRole('button', { name: 'Apply' }),
      ).toBeTruthy();
    });

    it('shows just the formatted time in the trigger, never a date', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: {
          view: 'time',
          ariaLabel: 'Choose a date',
          value: new Date(2026, 7, 19, 14, 37, 0),
        },
      });
      const text = (within(container).getByRole('combobox') as HTMLInputElement)
        .value;
      expect(text).not.toContain('2026');
      expect(text).not.toContain('19');
    });

    it('the trigger stays read-only for typing', () => {
      const { container } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { view: 'time', ariaLabel: 'Choose a date' },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLInputElement).readOnly,
      ).toBe(true);
    });

    it('stepping the hour live-updates value(), preserving today as the date part when unset', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        { inputs: { view: 'time', ariaLabel: 'Choose a date' } },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Increment hour',
        }),
      );

      expect(componentInstance.value()).toEqual(new Date(2026, 7, 19, 1, 0, 0));
    });

    it("stepping the minute preserves an existing value's date part", async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDatePicker,
        {
          inputs: {
            view: 'time',
            ariaLabel: 'Choose a date',
            value: new Date(2026, 5, 1, 10, 0, 0),
          },
        },
      );
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Increment minute',
        }),
      );

      expect(componentInstance.value()).toEqual(new Date(2026, 5, 1, 10, 1, 0));
      expect(getSpinbutton('Minute').getAttribute('aria-valuenow')).toBe('1');
    });

    it('Apply closes the panel and refocuses the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { view: 'time', ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'Apply',
        }),
      );
      await settle(fixture);

      expect(getDialog()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('falls back to a "Choose a time" dialog aria-label when ariaLabel is unset', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { view: 'time' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getDialog()?.getAttribute('aria-label')).toBe('Choose a time');
    });

    it('has no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoDatePicker, {
        inputs: { view: 'time', ariaLabel: 'Choose a date' },
      });
      const trigger = within(container).getByRole('combobox');
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });
});
