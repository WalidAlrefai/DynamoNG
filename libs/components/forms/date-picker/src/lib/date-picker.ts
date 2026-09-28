import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import { DynamoListboxBase, selectClearButtonStyles } from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import {
  addDays,
  addMonths,
  addYears,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday as dateFnsIsToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  buildCalendarGrid,
  clampToRange,
  isDateDisabled,
  type DynamoDatePickerWeekday,
} from './date-picker.calendar';
import { getCachedDateTimeFormat } from './date-format-cache';
import {
  datePickerApplyButtonStyles,
  datePickerDayStyles,
  datePickerHeaderButtonStyles,
  datePickerMeridiemButtonStyles,
  datePickerMonthGridButtonStyles,
  datePickerPanelStyles,
  datePickerQuickJumpButtonStyles,
  datePickerTimeFieldStyles,
  datePickerTimeSeparatorStyles,
  datePickerTimeStepButtonStyles,
  datePickerTimeValueStyles,
  datePickerTimeWrapperStyles,
  datePickerTriggerStyles,
  datePickerWeekdayStyles,
} from './date-picker.styles';
import type {
  DynamoDatePickerHourFormat,
  DynamoDatePickerPart,
  DynamoDatePickerSize,
} from './date-picker.types';

/** Wraps `n` into `[0, m)` — e.g. `wrapMod(23 + 1, 24) === 0`. */
function wrapMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Preferred corner first (bottom-start), the other three as CDK collision
// fallbacks — same shape as DynamoMenu's position list, but DatePicker has
// no `position` input in v1, so it's a single hardcoded array.
const POSITIONS: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 4,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -4,
  },
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 4,
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -4,
  },
];

/** The 12 month indices (0 = January), for rendering the quick-jump month grid. */
const MONTH_INDICES = Array.from({ length: 12 }, (_, i) => i);

@Component({
  selector: 'dg-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './date-picker.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoDatePicker),
      multi: true,
    },
  ],
})
export class DynamoDatePicker
  extends DynamoListboxBase<DynamoDatePickerPart>
  implements ControlValueAccessor
{
  readonly placeholder = input('Select a date');
  readonly size = input<DynamoDatePickerSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);
  readonly weekStartsOn = input<DynamoDatePickerWeekday>(0);
  readonly invalid = input(false);
  /** HTML `readonly` semantics: the trigger and calendar stay fully browsable
   *  (open, navigate months, roving focus), but selecting a day is blocked.
   *  Unlike `disabled`, does not remove the control from the tab order or
   *  dim its appearance. */
  readonly readOnly = input(false);
  /** Individual dates disabled beyond the `min`/`max` range — e.g. holidays. Only blocks selection, not keyboard navigation onto them (same posture as `min`/`max`). */
  readonly disabledDates = input<Date[]>([]);
  /** Weekdays disabled beyond the `min`/`max` range — e.g. `[0, 6]` for weekends. `0` is Sunday, matching `date-fns`. */
  readonly disabledDays = input<number[]>([]);
  /** Shows a clear (×) button next to the trigger once a value is selected — mirrors `DynamoSelect`'s own `clearable`. Ignored when `inline`, which has no trigger to attach it to. */
  readonly clearable = input(false);
  /** Renders the calendar directly in the page, with no trigger button or overlay — for embedding the picker permanently rather than behind a popup. */
  readonly inline = input(false);
  /** Renders hour/minute (and optionally second) steppers below the calendar. Selecting a day no longer
   *  closes the popup while this is on — an Apply button does that instead — since the panel now has more
   *  for the user to do (set the time) before they're done. */
  readonly showTime = input(false);
  readonly hourFormat = input<DynamoDatePickerHourFormat>('24');
  /** Also renders a seconds stepper — off by default (most consumers only need hour/minute). */
  readonly showSeconds = input(false);

  /** Two-way bindable; also driven by Angular forms via `writeValue`/`setDisabledState`. */
  readonly value = model<Date | null>(null);
  readonly disabled = model(false);
  /** Two-way bindable: `<dg-date-picker [(open)]="isOpen">`. */
  readonly open = model(false);

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly dayButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('dayButton');

  protected readonly triggerId = this.idGenerator.next(
    'dg-date-picker-trigger',
  );
  protected readonly dialogId = this.idGenerator.next('dg-date-picker-dialog');
  protected readonly monthLabelId = `${this.dialogId}-month-label`;

  /** Sole source of truth for both the visible month and the roving-focus cursor. */
  protected readonly focusedDate = signal<Date>(startOfDay(new Date()));
  /** Time-of-day for `showTime` mode — deliberately separate from `focusedDate`,
   *  which stays `startOfDay`-truncated everywhere else (grid nav, `clampToRange`,
   *  `isSameDay` comparisons) regardless of `showTime`. */
  protected readonly timeOfDay = signal({ hours: 0, minutes: 0, seconds: 0 });
  protected readonly visibleMonth = computed(() =>
    startOfMonth(this.focusedDate()),
  );
  protected readonly calendarDays = computed(() =>
    buildCalendarGrid(this.visibleMonth(), this.weekStartsOn()),
  );
  protected readonly weeks = computed(() => {
    const days = this.calendarDays();
    return Array.from({ length: 6 }, (_, row) =>
      days.slice(row * 7, row * 7 + 7),
    );
  });

  protected readonly triggerLabel = computed(() => {
    const value = this.value();
    if (!value) return this.placeholder();
    const dateStr = getCachedDateTimeFormat(this.config.locale, {
      dateStyle: 'medium',
    }).format(value);
    if (!this.showTime()) return dateStr;
    const timeStr = getCachedDateTimeFormat(this.config.locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(this.showSeconds() ? { second: '2-digit' as const } : {}),
      hour12: this.hourFormat() === '12',
    }).format(value);
    return `${dateStr}, ${timeStr}`;
  });
  protected readonly monthLabel = computed(() =>
    getCachedDateTimeFormat(this.config.locale, {
      month: 'long',
      year: 'numeric',
    }).format(this.visibleMonth()),
  );
  protected readonly weekdayLabels = computed(() => {
    const formatter = getCachedDateTimeFormat(this.config.locale, {
      weekday: 'short',
    });
    return this.calendarDays()
      .slice(0, 7)
      .map((day) => formatter.format(day));
  });

  protected readonly displayHour = computed(() => {
    const hours = this.timeOfDay().hours;
    if (this.hourFormat() === '24') return hours;
    const h12 = hours % 12;
    return h12 === 0 ? 12 : h12;
  });
  protected readonly hourDisplay = computed(() =>
    String(this.displayHour()).padStart(2, '0'),
  );
  protected readonly minuteDisplay = computed(() =>
    String(this.timeOfDay().minutes).padStart(2, '0'),
  );
  protected readonly secondDisplay = computed(() =>
    String(this.timeOfDay().seconds).padStart(2, '0'),
  );
  protected readonly meridiem = computed(() =>
    this.timeOfDay().hours < 12 ? 'AM' : 'PM',
  );

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          datePickerTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly panelClasses = datePickerPanelStyles;
  protected readonly headerButtonClasses = datePickerHeaderButtonStyles;
  protected readonly weekdayClasses = datePickerWeekdayStyles;
  protected readonly clearButtonClasses = selectClearButtonStyles;
  protected readonly quickJumpButtonClasses = datePickerQuickJumpButtonStyles;
  protected readonly monthGridButtonClasses = datePickerMonthGridButtonStyles;
  protected readonly timeWrapperClasses = datePickerTimeWrapperStyles;
  protected readonly timeFieldClasses = datePickerTimeFieldStyles;
  protected readonly timeStepButtonClasses = datePickerTimeStepButtonStyles;
  protected readonly timeValueClasses = datePickerTimeValueStyles;
  protected readonly timeSeparatorClasses = datePickerTimeSeparatorStyles;
  protected readonly meridiemButtonClasses = datePickerMeridiemButtonStyles;
  protected readonly applyButtonClasses = datePickerApplyButtonStyles;

  /** Swaps the day grid for a month/year quick-jump grid, replacing the plain prev/next-only navigation. */
  protected readonly quickJumpOpen = signal(false);
  protected readonly quickJumpYear = signal(new Date().getFullYear());
  protected readonly monthIndices = MONTH_INDICES;

  /** First effect run while `inline` is true is skipped — see the constructor's day-focus effect doc comment for why. */
  private inlineFocusReady = false;

  private onChangeFn: (value: Date | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  constructor() {
    super();

    effect(() => {
      if (this.open()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });

    // Waits for the async-attached portal's day buttons to exist before
    // focusing, then reruns on every focusedDate change (arrow-key nav,
    // Home/End/PageUp/PageDown, or a header nav click) — the effect covers
    // in-month navigation (same 42 buttons) and month/year changes (a fresh
    // set of 42 buttons) with the same lookup.
    //
    // `inline` also keeps this effect live (the calendar has no `open()`
    // moment of its own to gate on), but its very first run is skipped —
    // otherwise an always-visible inline calendar would steal focus from
    // wherever it legitimately was on the page the instant it mounts. Every
    // run after that first one is safe to focus unconditionally: `focusedDate`
    // only changes afterward via `moveFocus()`/`selectDay()`, both of which
    // are only reachable from a keydown/click that already has a day button
    // focused.
    effect(() => {
      const visible = this.open() || this.inline();
      if (!visible) return;
      const days = this.calendarDays();
      const buttons = this.dayButtons();
      if (buttons.length !== days.length) return;
      if (this.inline() && !this.inlineFocusReady) {
        this.inlineFocusReady = true;
        return;
      }
      const index = days.findIndex((day) => isSameDay(day, this.focusedDate()));
      buttons[index]?.nativeElement.focus();
    });

    // Keeps the visible month in sync with `value` for `inline` mode, which
    // has no `openPanel()` moment of its own to re-anchor `focusedDate` from
    // the current value the way opening the popup does.
    effect(() => {
      if (!this.inline()) return;
      const currentValue = this.value();
      const anchor = currentValue ?? startOfDay(new Date());
      this.focusedDate.set(clampToRange(anchor, this.min(), this.max()));
      if (this.showTime()) {
        this.seedTimeOfDay(currentValue);
      }
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  protected dayClasses(day: Date): string {
    return datePickerDayStyles({
      selected: this.isSelected(day),
      outsideMonth: !isSameMonth(day, this.visibleMonth()),
      today: this.isToday(day),
    });
  }

  /** Full formatted date for screen readers — the visible button text is just the bare day number. */
  protected dayAriaLabel(day: Date): string {
    return getCachedDateTimeFormat(this.config.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(day);
  }

  protected isSelected(day: Date): boolean {
    const value = this.value();
    return value !== null && isSameDay(day, value);
  }

  protected isToday(day: Date): boolean {
    return dateFnsIsToday(day);
  }

  protected isDisabled(day: Date): boolean {
    return isDateDisabled(
      day,
      this.min(),
      this.max(),
      this.disabledDates(),
      this.disabledDays(),
    );
  }

  protected isFocused(day: Date): boolean {
    return isSameDay(day, this.focusedDate());
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.disabled()) return;
    const currentValue = this.value();
    const anchor = currentValue ?? startOfDay(new Date());
    this.focusedDate.set(clampToRange(anchor, this.min(), this.max()));
    if (this.showTime()) {
      this.seedTimeOfDay(currentValue);
    }
    this.open.set(true);
  }

  /** Seeds `timeOfDay` from `source`'s own hours/minutes/seconds, or from the
   *  current wall-clock time if `source` is null — same "anchor from value,
   *  else now" idiom `openPanel`/the inline-sync effect already use for
   *  `focusedDate`. */
  private seedTimeOfDay(source: Date | null): void {
    const base = source ?? new Date();
    this.timeOfDay.set({
      hours: base.getHours(),
      minutes: base.getMinutes(),
      seconds: this.showSeconds() ? base.getSeconds() : 0,
    });
  }

  protected close(): void {
    this.open.set(false);
    this.onTouchedFn();
  }

  protected selectDay(day: Date): void {
    if (this.readOnly() || this.isDisabled(day)) return;
    this.focusedDate.set(day);
    if (this.showTime()) {
      this.applyValue(this.composeDateTime(day, this.timeOfDay()));
    } else {
      this.commit(day);
    }
  }

  protected navigateMonth(delta: number): void {
    this.moveFocus((date) => addMonths(date, delta));
  }

  protected toggleQuickJump(): void {
    if (!this.quickJumpOpen()) {
      this.quickJumpYear.set(this.visibleMonth().getFullYear());
    }
    this.quickJumpOpen.update((isOpen) => !isOpen);
  }

  protected quickJumpYearStep(delta: number): void {
    this.quickJumpYear.update((year) => year + delta);
  }

  protected selectQuickJumpMonth(monthIndex: number): void {
    const target = clampToRange(
      new Date(this.quickJumpYear(), monthIndex, 1),
      this.min(),
      this.max(),
    );
    this.focusedDate.set(target);
    this.quickJumpOpen.set(false);
  }

  protected monthAbbrev(monthIndex: number): string {
    return getCachedDateTimeFormat(this.config.locale, {
      month: 'short',
    }).format(new Date(2000, monthIndex, 1));
  }

  protected quickJumpMonthClasses(monthIndex: number): string {
    return datePickerMonthGridButtonStyles({
      current:
        this.quickJumpYear() === this.visibleMonth().getFullYear() &&
        monthIndex === this.visibleMonth().getMonth(),
    });
  }

  /** True only when the *entire* month falls outside [min, max] — a month that partially overlaps the allowed range stays selectable (day-level clamping still applies once inside it). */
  protected isQuickJumpMonthDisabled(monthIndex: number): boolean {
    const min = this.min();
    const max = this.max();
    if (!min && !max) return false;
    const monthStart = startOfMonth(
      new Date(this.quickJumpYear(), monthIndex, 1),
    );
    const monthEnd = addDays(addMonths(monthStart, 1), -1);
    if (max && isBefore(startOfDay(max), monthStart)) return true;
    if (min && isBefore(monthEnd, startOfDay(min))) return true;
    return false;
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.open()) this.openPanel();
        break;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    // Escape closes the quick-jump grid first, not the whole dialog — a
    // second Escape (now that quick-jump is closed) falls through to the
    // normal case below and closes the panel.
    if (event.key === 'Escape' && this.quickJumpOpen()) {
      this.quickJumpOpen.set(false);
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case 'ArrowRight':
        this.moveFocus((date) => addDays(date, 1));
        break;
      case 'ArrowLeft':
        this.moveFocus((date) => addDays(date, -1));
        break;
      case 'ArrowDown':
        this.moveFocus((date) => addDays(date, 7));
        break;
      case 'ArrowUp':
        this.moveFocus((date) => addDays(date, -7));
        break;
      case 'Home':
        this.moveFocus((date) =>
          startOfWeek(date, { weekStartsOn: this.weekStartsOn() }),
        );
        break;
      case 'End':
        this.moveFocus((date) =>
          addDays(startOfWeek(date, { weekStartsOn: this.weekStartsOn() }), 6),
        );
        break;
      case 'PageUp':
        this.moveFocus((date) =>
          event.shiftKey ? addYears(date, -1) : addMonths(date, -1),
        );
        break;
      case 'PageDown':
        this.moveFocus((date) =>
          event.shiftKey ? addYears(date, 1) : addMonths(date, 1),
        );
        break;
      case 'Escape':
        if (this.inline()) return; // nothing to escape from — no popup to close
        this.close();
        this.triggerEl().nativeElement.focus();
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  // Every navigation path goes through here. v1's only disabling is a
  // contiguous min/max range (no scattered `disabledDate` predicate), so
  // clamping to the boundary is sufficient — no scan-and-skip loop like
  // DynamoSelect/DynamoMenu's `findEnabledIndex` is needed.
  private moveFocus(next: (date: Date) => Date): void {
    this.focusedDate.set(
      clampToRange(next(this.focusedDate()), this.min(), this.max()),
    );
  }

  private commit(day: Date): void {
    const normalized = startOfDay(day);
    this.applyValue(normalized);
    this.close();
    if (!this.inline()) {
      this.triggerEl().nativeElement.focus();
    }
  }

  private applyValue(date: Date): void {
    this.value.set(date);
    this.onChangeFn(date);
  }

  private composeDateTime(
    day: Date,
    time: { hours: number; minutes: number; seconds: number },
  ): Date {
    const result = new Date(day);
    result.setHours(
      time.hours,
      time.minutes,
      this.showSeconds() ? time.seconds : 0,
      0,
    );
    return result;
  }

  protected stepHour(delta: number): void {
    if (this.readOnly()) return;
    this.timeOfDay.update((t) => ({
      ...t,
      hours: wrapMod(t.hours + delta, 24),
    }));
    this.commitTime();
  }

  protected stepMinute(delta: number): void {
    if (this.readOnly()) return;
    this.timeOfDay.update((t) => ({
      ...t,
      minutes: wrapMod(t.minutes + delta, 60),
    }));
    this.commitTime();
  }

  protected stepSecond(delta: number): void {
    if (this.readOnly()) return;
    this.timeOfDay.update((t) => ({
      ...t,
      seconds: wrapMod(t.seconds + delta, 60),
    }));
    this.commitTime();
  }

  protected toggleMeridiem(): void {
    if (this.readOnly()) return;
    this.timeOfDay.update((t) => ({ ...t, hours: (t.hours + 12) % 24 }));
    this.commitTime();
  }

  private commitTime(): void {
    const base = this.value() ?? this.focusedDate();
    this.applyValue(this.composeDateTime(base, this.timeOfDay()));
  }

  /** Closes the popup after `showTime` editing — equivalent to clicking the
   *  trigger again or pressing Escape, just more discoverable; `value` is
   *  already live-synced by the steppers/day click, so there's nothing left
   *  to commit here. */
  protected applyAndClose(): void {
    this.close();
    if (!this.inline()) {
      this.triggerEl().nativeElement.focus();
    }
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.value.set(null);
    this.onChangeFn(null);
  }

  protected triggerElRef(): ElementRef<HTMLElement> {
    return this.triggerEl();
  }

  protected panelTemplateRef(): TemplateRef<unknown> {
    return this.panelTemplate();
  }

  protected overlayPositions(): ConnectedPosition[] {
    return POSITIONS;
  }

  writeValue(value: Date | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
