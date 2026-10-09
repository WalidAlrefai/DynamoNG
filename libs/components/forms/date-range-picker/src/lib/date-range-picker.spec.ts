import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { DynamoPassThrough } from '@dynamong/core/api';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamoDateRangePicker } from './date-range-picker';
import { DynamoDateRangePickerHarness } from './date-range-picker.harness';
import type {
  DynamoDateRange,
  DynamoDateRangePickerPart,
} from './date-range-picker.types';

// Fixed "today" for every test — a plain midweek Wednesday, matching
// DynamoDatePicker's own spec's fixture date.
const TODAY = new Date(2026, 7, 19);

function formatMedium(date: Date): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

// The CDK overlay portals `role="dialog"` content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container` element.
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

// `inline` mode renders no `role="dialog"` at all (confirmed via the
// template's own `[attr.role]="inline() ? null : 'dialog'"`) — getDialog()
// returns null there, so inline-mode tests query the fixture's own
// `container` directly instead.
function getInlineDayButtonByText(
  container: HTMLElement,
  text: string,
): HTMLButtonElement {
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>('table[role="grid"] button'),
  ).find((candidate) => candidate.textContent?.trim() === text);
  if (!button) throw new Error(`No day button with text "${text}" found`);
  return button;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-date-range-picker-test-host',
  standalone: true,
  imports: [DynamoDateRangePicker],
  template: `
    <dg-date-range-picker
      [(value)]="value"
      [(open)]="isOpen"
      [min]="min()"
      [max]="max()"
      ariaLabel="Choose a date range"
      placeholder="Choose a date range"
    />
  `,
})
class DateRangePickerTestHostComponent {
  readonly value = model<DynamoDateRange>({ start: null, end: null });
  readonly isOpen = model(false);
  readonly min = signal<Date | undefined>(undefined);
  readonly max = signal<Date | undefined>(undefined);
}

@Component({
  selector: 'dg-date-range-picker-pt-host',
  standalone: true,
  imports: [DynamoDateRangePicker],
  template: `
    <dg-date-range-picker
      ariaLabel="Choose a date range"
      [ariaDescribedby]="ariaDescribedby()"
      [fluid]="fluid()"
      [pt]="pt()"
    />
  `,
})
class DateRangePickerPtHostComponent {
  readonly ariaDescribedby = signal<string | undefined>(undefined);
  readonly fluid = signal(true);
  readonly pt = signal<
    DynamoPassThrough<DynamoDateRangePickerPart> | undefined
  >(undefined);
}

@Component({
  selector: 'dg-date-range-picker-reactive-form-host',
  standalone: true,
  imports: [DynamoDateRangePicker, ReactiveFormsModule],
  template: `<dg-date-range-picker
    [formControl]="control"
    ariaLabel="Choose a date range"
  />`,
})
class DateRangePickerReactiveFormHostComponent {
  readonly control = new FormControl<DynamoDateRange | null>(null);
}

describe('DynamoDateRangePicker', () => {
  beforeEach(() => {
    // Only fake `Date` — `settle()` relies on a real `setTimeout` to flush
    // the zoneless overlay-attach effect, which a full `vi.useFakeTimers()`
    // would also intercept and hang forever (same reasoning as DatePicker's
    // own spec).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function openPanel(
    container: HTMLElement,
    fixture: ComponentFixture<unknown>,
  ): Promise<void> {
    const trigger = within(container).getByRole('button', {
      name: 'Choose a date range',
    });
    await userEvent.click(trigger);
    await settle(fixture);
  }

  describe('creation', () => {
    it('renders a trigger button with the placeholder', () => {
      const { container } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );

      expect(
        within(container).getByRole('button', {
          name: 'Choose a date range',
        }).textContent,
      ).toContain('Choose a date range');
    });
  });

  describe('range selection', () => {
    it('sets start on the first click, leaves end unset, and keeps the panel open', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);

      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 10),
        end: null,
      });
      expect(getDialog()).not.toBeNull();
      expect(
        within(container).getByRole('button', {
          name: 'Choose a date range',
        }).textContent,
      ).toContain(`${formatMedium(new Date(2026, 7, 10))} – …`);
    });

    it('sets end on a later second click, commits, and closes the panel', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      await userEvent.click(getDayButtonByText('15'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 10),
        end: new Date(2026, 7, 15),
      });
      expect(getDialog()).toBeNull();
    });

    it('redefines the range when the second click is before the first (swap)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('15'));
      await settle(fixture);

      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 10),
        end: new Date(2026, 7, 15),
      });
    });

    it('yields a valid single-day range when the second click repeats the first', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 10),
        end: new Date(2026, 7, 10),
      });
    });

    it('previews the in-range hover state without mutating value()', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      await userEvent.hover(getDayButtonByText('15'));
      fixture.detectChanges();

      // The preview affects the rendered cell state, not the committed model.
      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 10),
        end: null,
      });
      const previewCell = getDayButtonByText('12').closest('[role="gridcell"]');
      expect(previewCell?.className).toContain('bg-primary/10');
    });

    it('extends and commits the range entirely from the keyboard', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      getDayButtonByText('10').focus();
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 10),
        end: new Date(2026, 7, 12),
      });
      expect(getDialog()).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    it.each([
      ['{ArrowRight}', '20'],
      ['{ArrowLeft}', '18'],
      ['{ArrowDown}', '26'],
      ['{ArrowUp}', '12'],
      ['{Home}', '16'],
      ['{End}', '22'],
    ])('moves focus with %s to day %s', async (key, expectedDay) => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);

      await userEvent.keyboard(key);

      expect(document.activeElement?.textContent?.trim()).toBe(expectedDay);
    });

    it('moves to the previous/next month on PageUp/PageDown', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);

      await userEvent.keyboard('{PageDown}');
      fixture.detectChanges();
      expect(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'September 2026',
        }),
      ).toBeTruthy();

      await userEvent.keyboard('{PageUp}');
      fixture.detectChanges();
      expect(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'August 2026',
        }),
      ).toBeTruthy();
    });

    it('moves to the previous/next year on Shift+PageUp/PageDown', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);

      await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
      fixture.detectChanges();
      expect(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'August 2027',
        }),
      ).toBeTruthy();
    });

    it('closes without changing the value and refocuses the trigger on Escape', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date range',
      });
      await openPanel(container, fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(componentInstance.value()).toEqual({ start: null, end: null });
      expect(getDialog()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('closes only the quick-jump grid on the first Escape, then the panel on the second', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'August 2026',
        }),
      );
      fixture.detectChanges();

      await userEvent.keyboard('{Escape}');
      fixture.detectChanges();
      expect(getDialog()?.querySelector('table[role="grid"]')).toBeTruthy();

      await userEvent.keyboard('{Escape}');
      await settle(fixture);
      expect(getDialog()).toBeNull();
    });
  });

  describe('inline', () => {
    it('renders the calendar directly with no trigger button or dialog role', () => {
      const { container } = renderDynamoComponent(DynamoDateRangePicker, {
        inputs: { ariaLabel: 'Choose a date range', inline: true },
      });

      expect(container.querySelector('[aria-haspopup="dialog"]')).toBeNull();
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(
        container.querySelectorAll('table[role="grid"] button').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('min / max / disabledDates / disabledDays', () => {
    it('blocks both endpoints from a disabled date', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDateRangePicker,
        {
          inputs: {
            ariaLabel: 'Choose a date range',
            disabledDates: [new Date(2026, 7, 20)],
          },
        },
      );
      await openPanel(container, fixture);

      expect(getDayButtonByText('20').disabled).toBe(true);
      getDayButtonByText('20').click();
      await settle(fixture);

      expect(componentInstance.value()).toEqual({ start: null, end: null });
    });

    it('blocks a disabled weekday from becoming the end of a range', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDateRangePicker,
        {
          // 2026-08-22 is a Saturday.
          inputs: {
            ariaLabel: 'Choose a date range',
            disabledDays: [0, 6],
          },
        },
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('20'));
      await settle(fixture);

      getDayButtonByText('22').click();
      await settle(fixture);

      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 20),
        end: null,
      });
    });

    it('clamps navigation to min/max', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoDateRangePicker,
        {
          inputs: {
            ariaLabel: 'Choose a date range',
            min: new Date(2026, 7, 17),
            max: new Date(2026, 7, 21),
          },
        },
      );
      await openPanel(container, fixture);

      await userEvent.keyboard('{End}');

      expect(document.activeElement?.textContent?.trim()).toBe('21');
    });
  });

  describe('clearable', () => {
    it('clears both start and end when the clear button is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoDateRangePicker,
        {
          inputs: {
            ariaLabel: 'Choose a date range',
            clearable: true,
            value: { start: new Date(2026, 7, 10), end: new Date(2026, 7, 15) },
          },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );

      expect(componentInstance.value()).toEqual({ start: null, end: null });
    });

    it('does not render a clear button when nothing is selected', () => {
      const { container } = renderDynamoComponent(DynamoDateRangePicker, {
        inputs: { ariaLabel: 'Choose a date range', clearable: true },
      });

      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('gives each day button a full formatted-date aria-label, with a range-position suffix on the endpoints', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);
      await userEvent.click(getDayButtonByText('15'));
      await settle(fixture);
      await openPanel(container, fixture);

      const start = getDayButtonByText('10');
      const middle = getDayButtonByText('12');
      expect(start.getAttribute('aria-label')).toBe(
        `${new Intl.DateTimeFormat('en', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(2026, 7, 10))}, start of range`,
      );
      expect(middle.getAttribute('aria-label')).not.toContain('range');
    });

    it('announces the visible month via a live region on navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);

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

    it('has no axe violations while the dialog is open', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('month/year quick-jump', () => {
    it('swaps the day grid for a 12-month grid and jumps to the selected month', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);

      await userEvent.click(
        within(getDialog() as HTMLElement).getByRole('button', {
          name: 'August 2026',
        }),
      );
      fixture.detectChanges();
      expect(getDialog()?.querySelector('table[role="grid"]')).toBeNull();

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
  });

  describe('state changes (ControlValueAccessor)', () => {
    it('propagates the start-only selection to a bound reactive FormControl', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerReactiveFormHostComponent,
      );
      await openPanel(container, fixture);

      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      expect(componentInstance.control.value).toEqual({
        start: new Date(2026, 7, 10),
        end: null,
      });
    });

    it('propagates a full range to a bound reactive FormControl', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerReactiveFormHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);

      await userEvent.click(getDayButtonByText('15'));
      await settle(fixture);

      expect(componentInstance.control.value).toEqual({
        start: new Date(2026, 7, 10),
        end: new Date(2026, 7, 15),
      });
    });

    it('resumes at the end-selection phase when writeValue supplies a start-only range', async () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DateRangePickerReactiveFormHostComponent,
      );
      componentInstance.control.setValue({
        start: new Date(2026, 7, 10),
        end: null,
      });
      fixture.detectChanges();
      await openPanel(container, fixture);

      await userEvent.click(getDayButtonByText('15'));
      await settle(fixture);

      expect(componentInstance.control.value).toEqual({
        start: new Date(2026, 7, 10),
        end: new Date(2026, 7, 15),
      });
    });

    it('disables the trigger when the bound FormControl is disabled (setDisabledState)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DateRangePickerReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(true);
    });
  });

  describe('harness', () => {
    it('opens the panel, reports the trigger text, and selects a range', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      const { TestbedHarnessEnvironment } =
        await import('@angular/cdk/testing/testbed');
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoDateRangePickerHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.selectRangeByLabel('10', '15');
      await settle(fixture);

      expect(componentInstance.value()).toEqual({
        start: new Date(2026, 7, 10),
        end: new Date(2026, 7, 15),
      });
    });
  });

  describe('disabled', () => {
    it('disables the day grid, nav buttons, and quick-jump toggle in inline mode (no trigger to otherwise gate access)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDateRangePicker,
        {
          inputs: {
            ariaLabel: 'Choose a date range',
            inline: true,
            disabled: true,
          },
        },
      );
      fixture.detectChanges();

      expect(getInlineDayButtonByText(container, '19').disabled).toBe(true);
      expect(
        (
          within(container).getByRole('button', {
            name: 'Previous month',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(container).getByRole('button', {
            name: 'Next month',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(container).getByRole('button', {
            name: 'August 2026',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);

      getInlineDayButtonByText(container, '20').click();
      await settle(fixture);

      expect(componentInstance.value()).toEqual({ start: null, end: null });
    });

    it('disables the year-stepper and month-grid buttons once the quick-jump grid is open', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDateRangePicker,
        { inputs: { ariaLabel: 'Choose a date range', inline: true } },
      );
      fixture.detectChanges();
      // Open the quick-jump grid while still enabled, then disable the
      // picker — mirrors Splitter's/Color Picker's own mid-interaction-
      // disable precedent, and avoids needing the already-confirmed-disabled
      // toggle button to open it in the first place.
      await userEvent.click(
        within(container).getByRole('button', { name: 'August 2026' }),
      );
      fixture.detectChanges();

      componentInstance.disabled.set(true);
      fixture.detectChanges();

      expect(
        (
          within(container).getByRole('button', {
            name: 'Previous year',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(container).getByRole('button', {
            name: 'Dec',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    it('stops committing a day click if disabled flips true mid-interaction (panel already open)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoDateRangePicker,
        { inputs: { ariaLabel: 'Choose a date range' } },
      );
      await openPanel(container, fixture);

      componentInstance.disabled.set(true);
      fixture.detectChanges();

      expect(getDayButtonByText('20').disabled).toBe(true);
      getDayButtonByText('20').click();
      await settle(fixture);

      expect(componentInstance.value()).toEqual({ start: null, end: null });
    });
  });

  describe('aria-selected', () => {
    it('is explicitly "false" (not absent) on non-endpoint cells, "true" on endpoints', async () => {
      const { container, fixture } = renderDynamoComponent(
        DateRangePickerTestHostComponent,
      );
      await openPanel(container, fixture);
      await userEvent.click(getDayButtonByText('10'));
      await settle(fixture);
      await userEvent.click(getDayButtonByText('15'));
      await settle(fixture);
      await openPanel(container, fixture);

      const endpointCell =
        getDayButtonByText('10').closest('[role="gridcell"]');
      const nonEndpointCell =
        getDayButtonByText('12').closest('[role="gridcell"]');
      expect(endpointCell?.getAttribute('aria-selected')).toBe('true');
      expect(nonEndpointCell?.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('pt / ariaDescribedby / fluid', () => {
    it('merges pt class onto root/trigger', () => {
      const { fixture, container } = renderDynamoComponent(
        DateRangePickerPtHostComponent,
      );
      fixture.componentInstance.pt.set({
        root: { class: 'pt-root' },
        trigger: { class: 'pt-trigger' },
      });
      fixture.detectChanges();

      const trigger = within(container).getByRole('button', {
        name: 'Choose a date range',
      });
      // `root` is a separate `display: contents` wrapper around the
      // trigger/clear-button pair, not merged onto the trigger itself.
      expect(trigger.parentElement?.classList.contains('pt-root')).toBe(true);
      expect(trigger.classList.contains('pt-trigger')).toBe(true);
    });

    it('merges a non-class pt attribute onto the trigger', () => {
      const { fixture, container } = renderDynamoComponent(
        DateRangePickerPtHostComponent,
      );
      fixture.componentInstance.pt.set({
        trigger: { 'data-testid': 'trigger-el' },
      });
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="trigger-el"]'),
      ).not.toBeNull();
    });

    it('merges pt class onto panel/day once open', async () => {
      const { fixture, container } = renderDynamoComponent(
        DateRangePickerPtHostComponent,
      );
      fixture.componentInstance.pt.set({
        panel: { class: 'pt-panel' },
        day: { class: 'pt-day' },
      });
      fixture.detectChanges();
      await openPanel(container, fixture);

      expect(getDialog()?.classList.contains('pt-panel')).toBe(true);
      expect(getDayButtons().length).toBeGreaterThan(0);
      expect(
        getDayButtons().every((button) => button.classList.contains('pt-day')),
      ).toBe(true);
    });

    it('omits aria-describedby by default, forwards it to the trigger when set', () => {
      const { fixture, container } = renderDynamoComponent(
        DateRangePickerPtHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date range',
      });
      expect(trigger.getAttribute('aria-describedby')).toBeNull();

      fixture.componentInstance.ariaDescribedby.set('hint-id');
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-describedby')).toBe('hint-id');
    });

    it('defaults fluid to true (w-full), opts out when false', () => {
      const { fixture, container } = renderDynamoComponent(
        DateRangePickerPtHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Choose a date range',
      });
      expect(trigger.className).toContain('w-full');

      fixture.componentInstance.fluid.set(false);
      fixture.detectChanges();
      expect(trigger.className).not.toContain('w-full');
    });

    it('has no axe violations with pt/ariaDescribedby/fluid set', async () => {
      const { fixture, container } = renderDynamoComponent(
        DateRangePickerPtHostComponent,
      );
      fixture.componentInstance.ariaDescribedby.set('hint-id');
      fixture.componentInstance.pt.set({ trigger: { class: 'pt-trigger' } });
      fixture.detectChanges();

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
