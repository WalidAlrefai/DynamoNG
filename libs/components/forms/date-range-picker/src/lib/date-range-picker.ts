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
import {
  buildCalendarGrid,
  clampToRange,
  getCachedDateTimeFormat,
  isDateDisabled,
  type DynamoDatePickerWeekday,
} from '@dynamong/date-picker';
import { cn } from '@dynamong/utils/class-merge';
import {
  addDays,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday as dateFnsIsToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  dateRangePickerCellStyles,
  dateRangePickerDayStyles,
  dateRangePickerHeaderButtonStyles,
  dateRangePickerMonthGridButtonStyles,
  dateRangePickerPanelStyles,
  dateRangePickerQuickJumpButtonStyles,
  dateRangePickerTriggerStyles,
  dateRangePickerWeekdayStyles,
} from './date-range-picker.styles';
import type {
  DynamoDateRange,
  DynamoDateRangePickerPart,
  DynamoDateRangePickerSize,
} from './date-range-picker.types';

// Same shape as DynamoDatePicker's own position list — kept as a separate
// array (not re-exported/shared) since it's a trivial literal, not logic.
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

const MONTH_INDICES = Array.from({ length: 12 }, (_, i) => i);
const EMPTY_RANGE: DynamoDateRange = { start: null, end: null };

/**
 * A two-date range picker built on the same month-grid calendar as
 * DynamoDatePicker (`buildCalendarGrid`/`clampToRange`/`isDateDisabled`,
 * imported from `@dynamong/date-picker` rather than duplicated — see that
 * package's README). Kept as a separate component rather than a `mode`
 * flag on DynamoDatePicker, matching the DynamoSelect/DynamoMultiSelect
 * precedent (separate component per selection cardinality) and keeping
 * DynamoDatePicker's `Date | null` value type unchanged.
 */
@Component({
  selector: 'dg-date-range-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './date-range-picker.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoDateRangePicker),
      multi: true,
    },
  ],
})
export class DynamoDateRangePicker
  extends DynamoListboxBase<DynamoDateRangePickerPart>
  implements ControlValueAccessor
{
  readonly placeholder = input('Select a date range');
  readonly size = input<DynamoDateRangePickerSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);
  readonly weekStartsOn = input<DynamoDatePickerWeekday>(0);
  readonly invalid = input(false);
  readonly readOnly = input(false);
  readonly disabledDates = input<Date[]>([]);
  readonly disabledDays = input<number[]>([]);
  readonly clearable = input(false);
  readonly inline = input(false);

  /** Two-way bindable; also driven by Angular forms via `writeValue`/`setDisabledState`. */
  readonly value = model<DynamoDateRange>(EMPTY_RANGE);
  readonly disabled = model(false);
  /** Two-way bindable: `<dg-date-range-picker [(open)]="isOpen">`. */
  readonly open = model(false);

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly dayButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('dayButton');

  protected readonly triggerId = this.idGenerator.next(
    'dg-date-range-picker-trigger',
  );
  protected readonly dialogId = this.idGenerator.next(
    'dg-date-range-picker-dialog',
  );
  protected readonly monthLabelId = `${this.dialogId}-month-label`;

  /** Sole source of truth for both the visible month and the roving-focus cursor. */
  protected readonly focusedDate = signal<Date>(startOfDay(new Date()));
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

  /** Which end of the range the next click/commit sets. Resets to 'start' once a range is fully committed. */
  protected readonly selectionPhase = signal<'start' | 'end'>('start');
  /** Live pointer position while picking the end date, for the in-progress range preview. */
  protected readonly hoverDate = signal<Date | null>(null);

  private readonly previewEnd = computed(() =>
    this.selectionPhase() === 'end'
      ? (this.hoverDate() ?? this.focusedDate())
      : null,
  );

  /** The range currently shown in the grid — the committed range, or the committed start plus a live preview end while mid-selection. */
  protected readonly displayRange = computed(() => {
    const { start, end } = this.value();
    const effectiveEnd = end ?? this.previewEnd();
    if (!start) return null;
    if (!effectiveEnd) return { from: start, to: start };
    return isBefore(effectiveEnd, start)
      ? { from: effectiveEnd, to: start }
      : { from: start, to: effectiveEnd };
  });

  protected readonly triggerLabel = computed(() => {
    const { start, end } = this.value();
    if (!start) return this.placeholder();
    const format = (date: Date) =>
      getCachedDateTimeFormat(this.config.locale, {
        dateStyle: 'medium',
      }).format(date);
    return end ? `${format(start)} – ${format(end)}` : `${format(start)} – …`;
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

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          dateRangePickerTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly panelClasses = dateRangePickerPanelStyles;
  protected readonly headerButtonClasses = dateRangePickerHeaderButtonStyles;
  protected readonly weekdayClasses = dateRangePickerWeekdayStyles;
  protected readonly clearButtonClasses = selectClearButtonStyles;
  protected readonly quickJumpButtonClasses =
    dateRangePickerQuickJumpButtonStyles;
  protected readonly monthGridButtonClasses =
    dateRangePickerMonthGridButtonStyles;

  /** Swaps the day grid for a month/year quick-jump grid — identical mechanics to DynamoDatePicker's. */
  protected readonly quickJumpOpen = signal(false);
  protected readonly quickJumpYear = signal(new Date().getFullYear());
  protected readonly monthIndices = MONTH_INDICES;

  /** First effect run while `inline` is true is skipped — see the constructor's day-focus effect doc comment for why. */
  private inlineFocusReady = false;

  private onChangeFn: (value: DynamoDateRange) => void = () => {
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

    // See DynamoDatePicker's identical effect for the full rationale — same
    // mechanics apply unchanged here.
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

    effect(() => {
      if (!this.inline()) return;
      const anchor = this.value().start ?? startOfDay(new Date());
      this.focusedDate.set(clampToRange(anchor, this.min(), this.max()));
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  protected dayClasses(day: Date): string {
    const state = this.dayRangeState(day);
    return dateRangePickerDayStyles({
      endpoint: state.isStart || state.isEnd,
      outsideMonth: !isSameMonth(day, this.visibleMonth()),
      today: this.isToday(day),
    });
  }

  protected cellClasses(day: Date): string {
    return dateRangePickerCellStyles({
      inRange: this.dayRangeState(day).inRange,
    });
  }

  protected dayRangeState(day: Date): {
    isStart: boolean;
    isEnd: boolean;
    inRange: boolean;
  } {
    const range = this.displayRange();
    if (!range) return { isStart: false, isEnd: false, inRange: false };
    const isStart = isSameDay(day, range.from);
    const isEnd = isSameDay(day, range.to);
    return {
      isStart,
      isEnd,
      inRange:
        !isSameDay(range.from, range.to) &&
        isAfter(day, range.from) &&
        isBefore(day, range.to),
    };
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

  /** Full formatted date for screen readers, with a range-position suffix — the visible button text is just the bare day number. */
  protected dayAriaLabel(day: Date): string {
    const formatted = getCachedDateTimeFormat(this.config.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(day);
    const state = this.dayRangeState(day);
    if (state.isStart && state.isEnd) return formatted;
    if (state.isStart) return `${formatted}, start of range`;
    if (state.isEnd) return `${formatted}, end of range`;
    return formatted;
  }

  protected onDayHover(day: Date): void {
    this.hoverDate.set(day);
  }

  protected onGridLeave(): void {
    this.hoverDate.set(null);
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
    const anchor = this.value().start ?? startOfDay(new Date());
    this.focusedDate.set(clampToRange(anchor, this.min(), this.max()));
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    this.onTouchedFn();
  }

  protected selectDay(day: Date): void {
    if (this.readOnly() || this.isDisabled(day)) return;
    this.focusedDate.set(day);

    if (this.selectionPhase() === 'start') {
      this.value.set({ start: startOfDay(day), end: null });
      this.onChangeFn(this.value());
      this.selectionPhase.set('end');
      return;
    }

    // A click before the current start redefines the range (the click
    // becomes the new, earlier boundary) rather than resetting or erroring
    // — standard range-picker UX. A same-day second click yields a valid
    // 1-day range (start === end), not specially handled.
    const start = this.value().start as Date;
    const day0 = startOfDay(day);
    this.value.set(
      isBefore(day0, start)
        ? { start: day0, end: start }
        : { start, end: day0 },
    );
    this.onChangeFn(this.value());
    this.selectionPhase.set('start');
    this.hoverDate.set(null);
    this.close();
    if (!this.inline()) {
      this.triggerEl().nativeElement.focus();
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
    return dateRangePickerMonthGridButtonStyles({
      current:
        this.quickJumpYear() === this.visibleMonth().getFullYear() &&
        monthIndex === this.visibleMonth().getMonth(),
    });
  }

  /** True only when the *entire* month falls outside [min, max] — a month that partially overlaps the allowed range stays selectable. */
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
        if (this.inline()) return;
        this.close();
        this.triggerEl().nativeElement.focus();
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  private moveFocus(next: (date: Date) => Date): void {
    this.focusedDate.set(
      clampToRange(next(this.focusedDate()), this.min(), this.max()),
    );
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.value.set(EMPTY_RANGE);
    this.onChangeFn(EMPTY_RANGE);
    this.selectionPhase.set('start');
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

  writeValue(value: DynamoDateRange | null): void {
    this.value.set(value ?? EMPTY_RANGE);
    this.selectionPhase.set(value?.start && !value.end ? 'end' : 'start');
  }

  registerOnChange(fn: (value: DynamoDateRange) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
