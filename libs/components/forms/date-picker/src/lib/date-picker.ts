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
import { DynamoPassThroughDirective } from '@dynamong/core/base';
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
  applyDateMask,
  formatDate,
  inferFormatFromLocale,
  parseDateString,
  parseFormatTokens,
  type FormatPart,
} from './date-picker-format';
import {
  datePickerApplyButtonStyles,
  datePickerButtonBarButtonStyles,
  datePickerDayStyles,
  datePickerHeaderButtonStyles,
  datePickerMeridiemButtonStyles,
  datePickerMonthGridButtonStyles,
  datePickerMonthGridWidthClass,
  datePickerPanelStyles,
  datePickerQuickJumpButtonStyles,
  datePickerTimeFieldStyles,
  datePickerTimeSeparatorStyles,
  datePickerTimeStepButtonStyles,
  datePickerTimeValueStyles,
  datePickerTimeWrapperStyles,
  datePickerTriggerIconButtonStyles,
  datePickerTriggerInputStyles,
  datePickerTriggerStyles,
  datePickerWeekdayStyles,
} from './date-picker.styles';
import type {
  DynamoDatePickerHourFormat,
  DynamoDatePickerPart,
  DynamoDatePickerSelectionMode,
  DynamoDatePickerSize,
  DynamoDatePickerVariant,
  DynamoDatePickerView,
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
  imports: [NgTemplateOutlet, DynamoPassThroughDirective],
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
  readonly variant = input<DynamoDatePickerVariant>('outlined');
  /** Fills the width of its container. Defaults true to match every existing consumer's
   *  assumption of a full-width trigger; set false for PrimeNG-style intrinsic sizing. */
  readonly fluid = input(true);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the trigger with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** BCP 47 locale tag overriding `DYNAMONG_CONFIG.locale` for this instance only —
   *  mirrors `@dynamong/input-number`'s `locale` input. */
  readonly locale = input<string | undefined>(undefined);
  /** A small token format string (`d`/`dd`/`m`/`mm`/`yy`/`yyyy` + literals, e.g.
   *  `'mm/dd/yyyy'`) controlling both the typed/displayed text and what typing
   *  parses against. Unset infers the format from `locale`/the injected config's
   *  locale via `Intl.DateTimeFormat(..., { dateStyle: 'short' })`. Ignored while
   *  `showTime` is on — the trigger stays read-only-for-typing there, see README. */
  readonly dateFormat = input<string | undefined>(undefined);
  /** Applies a digit-only mask (derived from the active format's tokens) as the
   *  user types. Requires the active format to be fixed-width (`dd`/`mm`/`yyyy`/
   *  `yy`, not the flexible `d`/`m`) — a no-op otherwise. */
  readonly mask = input(false);
  /** `'date'` (default) is the normal day-grid picker. `'month'`/`'year'` replace the day
   *  grid with a committing month/year grid — the *existing* date-view quick-jump (opened via
   *  the month/year header label) still only navigates, unaffected. `'time'` drops the calendar
   *  entirely, showing only the hour/minute(/second) steppers — a calendar-free companion to
   *  `showTime`'s combined date+time mode, which stays unaffected. Typing (`dateFormat`/`mask`)
   *  is date-view only — the trigger stays read-only-for-typing in the other views. */
  readonly view = input<DynamoDatePickerView>('date');
  /** `'single'` (default) selects one `Date` via `value`. `'multiple'` toggles
   *  days in/out of `values` instead — the panel stays open across picks (closed
   *  via Escape/icon-button/outside-click, no Apply button). `view: 'date'` only;
   *  not supported combined with `showTime` in v1 — see README. */
  readonly selectionMode = input<DynamoDatePickerSelectionMode>('single');
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
  /** Adds a Today/Clear footer below the calendar (and, with showTime, above/alongside
   *  the existing Apply footer) — mirrors PrimeNG Calendar's showButtonBar. */
  readonly showButtonBar = input(false);
  /** Renders this many consecutive months side by side, starting from the anchor
   *  (focused) month. `view: 'date'` only (documented scope cut vs `view:
   *  'month'`/`'year'`, avoiding their cartesian product). Previous/Next always
   *  shifts the whole window by one month, not by `numberOfMonths` — matches
   *  PrimeNG's own multi-month UX. */
  readonly numberOfMonths = input(1);

  /** Two-way bindable; also driven by Angular forms via `writeValue`/`setDisabledState`.
   *  Ignored while `selectionMode() === 'multiple'` — see `values`. */
  readonly value = model<Date | null>(null);
  /** Two-way bindable; only meaningful while `selectionMode() === 'multiple'`. */
  readonly values = model<Date[]>([]);
  readonly disabled = model(false);
  /** Two-way bindable: `<dg-date-picker [(open)]="isOpen">`. */
  readonly open = model(false);

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly dayButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('dayButton');
  /** Only rendered for `view() === 'month'` — see the `view`-focus effect below. */
  private readonly monthViewButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('monthViewButton');
  /** Only rendered for `view() === 'year'`. */
  private readonly yearGridButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('yearGridButton');

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
  /** Non-null while the user has typed something not yet committed/reverted —
   *  `inputText` shows this verbatim instead of the value-derived text while set. */
  protected readonly typedDraft = signal<string | null>(null);
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

  /** `numberOfMonths` consecutive months starting from the anchor `visibleMonth`. */
  protected readonly visibleMonths = computed(() => {
    const first = this.visibleMonth();
    return Array.from({ length: this.numberOfMonths() }, (_, i) =>
      addMonths(first, i),
    );
  });

  /** One rendered grid per `visibleMonths()` entry — each with its own weeks
   *  and locale-formatted label, for the `numberOfMonths > 1` multi-month
   *  layout. With the default `numberOfMonths` of 1 this is exactly one grid
   *  whose `weeks` matches `weeks()` above. */
  protected readonly monthGrids = computed(() => {
    const weekStartsOn = this.weekStartsOn();
    const formatter = getCachedDateTimeFormat(
      this.locale() ?? this.config.locale,
      { month: 'long', year: 'numeric' },
    );
    return this.visibleMonths().map((month) => {
      const days = buildCalendarGrid(month, weekStartsOn);
      return {
        month,
        label: formatter.format(month),
        weeks: Array.from({ length: 6 }, (_, row) =>
          days.slice(row * 7, row * 7 + 7),
        ),
      };
    });
  });

  /** Every day-button across every rendered grid, in the exact same DOM order
   *  as `dayButtons()` (grid by grid, row by row) — critical, since the
   *  day-focus effect below indexes into `dayButtons()` by position found
   *  here. `owned` marks whether `day` is that *specific* grid's own month
   *  (vs. a leading/trailing day spilling in from a neighbor) — adjacent
   *  grids can render the *same* date twice (e.g. August's trailing days
   *  include early September, which September's own grid also renders for
   *  real), so the effect prefers an `owned` match over a spillover one when
   *  both exist, landing focus on the non-dimmed rendering. */
  protected readonly allCalendarDays = computed(() =>
    this.monthGrids().flatMap((grid) =>
      grid.weeks
        .flat()
        .map((day) => ({ day, owned: isSameMonth(day, grid.month) })),
    ),
  );

  protected readonly monthGridWidthClass = datePickerMonthGridWidthClass;

  /** Just the time portion — shared by `formattedValueWithTime` (date + time)
   *  and `inputText`'s `view: 'time'` branch (time only, no date). */
  private formattedTimeOnly(value: Date): string {
    return getCachedDateTimeFormat(this.locale() ?? this.config.locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(this.showSeconds() ? { second: '2-digit' as const } : {}),
      hour12: this.hourFormat() === '12',
    }).format(value);
  }

  /** Formats a committed value for display when `showTime` is on — date +
   *  time, locale-driven `Intl` medium/short styles (not the token-based
   *  `dateFormat`/`activeFormatParts`, which only govern the date-only,
   *  typable path below). */
  private formattedValueWithTime(value: Date): string {
    const dateStr = getCachedDateTimeFormat(
      this.locale() ?? this.config.locale,
      { dateStyle: 'medium' },
    ).format(value);
    return `${dateStr}, ${this.formattedTimeOnly(value)}`;
  }

  /** 0 selected → `''` (lets `placeholder` show through); 1–2 → comma-joined
   *  `formatDate` per entry (same formatter the single-mode typable path
   *  uses); 3+ → a `"N dates selected"` summary, to avoid an unbounded
   *  trigger string. Only meaningful while `selectionMode() === 'multiple'`. */
  protected readonly multiValueText = computed(() => {
    const values = this.values();
    if (values.length === 0) return '';
    if (values.length <= 2) {
      return values
        .map((v) => formatDate(v, this.activeFormatParts()))
        .join(', ');
    }
    return `${values.length} dates selected`;
  });

  /** The token format actively governing typed/displayed text: an explicit
   *  `dateFormat`, or one inferred from `locale`/the injected config's locale.
   *  Only meaningful while `showTime` is off (see `inputText`/`triggerReadOnly`). */
  protected readonly activeFormatParts = computed<FormatPart[]>(() => {
    const explicit = this.dateFormat();
    return explicit
      ? parseFormatTokens(explicit)
      : inferFormatFromLocale(this.locale() ?? this.config.locale);
  });

  /** The trigger `<input>`'s displayed value. Multi-select (`view: 'date'`
   *  only) shows `multiValueText` instead of anything `value`-derived.
   *  `view: 'month'`/`'year'` format with just a month+year / bare year;
   *  `view: 'time'` formats just the time portion (no date shown — there's
   *  nothing to pick a date from in this view). None of these have a typing
   *  grammar built — see `triggerReadOnly`. While `showTime` is on (combined
   *  date+time mode), the input shows the full date+time text, same as the
   *  pre-typable-input trigger did. Otherwise (`view: 'date'`, single-select,
   *  no `showTime`), shows the live typed draft if there is one, else the
   *  committed value formatted via `activeFormatParts` — empty when there's
   *  no value, letting the native `placeholder` attribute show through. */
  protected readonly inputText = computed(() => {
    if (this.selectionMode() === 'multiple' && this.view() === 'date') {
      return this.multiValueText();
    }
    const value = this.value();
    if (this.view() === 'month') {
      return value
        ? getCachedDateTimeFormat(this.locale() ?? this.config.locale, {
            month: 'long',
            year: 'numeric',
          }).format(value)
        : '';
    }
    if (this.view() === 'year') {
      return value
        ? getCachedDateTimeFormat(this.locale() ?? this.config.locale, {
            year: 'numeric',
          }).format(value)
        : '';
    }
    if (this.view() === 'time') {
      return value ? this.formattedTimeOnly(value) : '';
    }
    if (this.showTime()) {
      return value ? this.formattedValueWithTime(value) : '';
    }
    const draft = this.typedDraft();
    if (draft !== null) return draft;
    return value ? formatDate(value, this.activeFormatParts()) : '';
  });

  /** `showTime` mode, multi-select, and `view: 'month'`/`'year'`/`'time'` have
   *  no typing grammar built for them — the input stays browsable
   *  (click/icon-button/keyboard still open the panel) but not typable there,
   *  same v1 scope cut as `readOnly`. */
  protected readonly triggerReadOnly = computed(
    () =>
      this.readOnly() ||
      this.showTime() ||
      this.view() !== 'date' ||
      this.selectionMode() === 'multiple',
  );
  protected readonly monthLabel = computed(() =>
    getCachedDateTimeFormat(this.locale() ?? this.config.locale, {
      month: 'long',
      year: 'numeric',
    }).format(this.visibleMonth()),
  );

  /** `view: 'year'` shows a fixed 12-year block (floored to a multiple of 12,
   *  not a rolling "current year ± 6") — same fixed-block posture as most
   *  date-picker year grids, stepped a full block at a time via `stepYearGrid`. */
  protected readonly yearGridStart = computed(
    () => Math.floor(this.focusedDate().getFullYear() / 12) * 12,
  );
  protected readonly yearIndices = computed(() =>
    Array.from({ length: 12 }, (_, i) => this.yearGridStart() + i),
  );
  protected readonly yearGridLabel = computed(
    () => `${this.yearGridStart()} - ${this.yearGridStart() + 11}`,
  );
  protected readonly weekdayLabels = computed(() => {
    const formatter = getCachedDateTimeFormat(
      this.locale() ?? this.config.locale,
      {
        weekday: 'short',
      },
    );
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
      ? cn(this.styleClass(), this.ptFor('trigger').class)
      : cn(
          datePickerTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
            variant: this.variant(),
            fluid: this.fluid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
          this.ptFor('trigger').class,
        ),
  );
  protected readonly triggerInputClasses = datePickerTriggerInputStyles;
  protected readonly triggerIconButtonClasses =
    datePickerTriggerIconButtonStyles;
  protected readonly panelClasses = computed(() =>
    cn(
      datePickerPanelStyles({ multiMonth: this.numberOfMonths() > 1 }),
      this.ptFor('panel').class,
    ),
  );
  protected readonly headerButtonClasses = datePickerHeaderButtonStyles;
  protected readonly weekdayClasses = datePickerWeekdayStyles;
  protected readonly clearButtonClasses = selectClearButtonStyles;
  protected readonly quickJumpButtonClasses = datePickerQuickJumpButtonStyles;
  protected readonly monthGridButtonClasses = datePickerMonthGridButtonStyles;
  /** `view: 'time'` has nothing rendered above the steppers (no grid/header),
   *  so the wrapper's separator border/margin from the combined `showTime`
   *  case would be an orphaned line at the top of the panel — stripped there. */
  protected readonly timeWrapperClasses = computed(() =>
    this.view() === 'time'
      ? cn(datePickerTimeWrapperStyles, 'mt-0 border-t-0 pt-0')
      : datePickerTimeWrapperStyles,
  );
  protected readonly timeFieldClasses = computed(() =>
    cn(datePickerTimeFieldStyles, this.ptFor('time-field').class),
  );
  protected readonly timeStepButtonClasses = datePickerTimeStepButtonStyles;
  protected readonly timeValueClasses = datePickerTimeValueStyles;
  protected readonly timeSeparatorClasses = datePickerTimeSeparatorStyles;
  protected readonly meridiemButtonClasses = datePickerMeridiemButtonStyles;
  protected readonly applyButtonClasses = computed(() =>
    cn(datePickerApplyButtonStyles, this.ptFor('apply-button').class),
  );
  protected readonly buttonBarButtonClasses = datePickerButtonBarButtonStyles;

  /** Swaps the day grid for a month/year quick-jump grid, replacing the plain prev/next-only navigation. */
  protected readonly quickJumpOpen = signal(false);
  protected readonly quickJumpYear = signal(new Date().getFullYear());
  protected readonly monthIndices = MONTH_INDICES;

  /** First effect run while `inline` is true is skipped — see the constructor's day-focus effect doc comment for why. */
  private inlineFocusReady = false;
  /** Consumed once by the day-focus effect below — set by `openPanel(false)`
   *  (clicking the typable input) to keep focus on the input instead of
   *  stealing it to the day grid the instant the panel opens. */
  private skipNextFocusGrid = false;

  private onChangeFn: (value: Date | Date[] | null) => void = () => {
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
      if (this.view() !== 'date') return;
      const visible = this.open() || this.inline();
      if (!visible) return;
      const days = this.allCalendarDays();
      const buttons = this.dayButtons();
      if (buttons.length !== days.length) return;
      if (this.inline() && !this.inlineFocusReady) {
        this.inlineFocusReady = true;
        return;
      }
      if (this.skipNextFocusGrid) {
        this.skipNextFocusGrid = false;
        return;
      }
      const focused = this.focusedDate();
      // Prefer an `owned` (non-dimmed) rendering of the target date; fall
      // back to a spillover one only when no grid actually owns it (e.g. the
      // very first grid's own leading days from the month before it, which
      // nothing else renders).
      let index = days.findIndex(
        (entry) => entry.owned && isSameDay(entry.day, focused),
      );
      if (index === -1) {
        index = days.findIndex((entry) => isSameDay(entry.day, focused));
      }
      buttons[index]?.nativeElement.focus();
    });

    // Mirrors the day-focus effect above, for `view: 'month'`/`'year'` — these
    // replace the day grid as the panel's primary interactive surface, so they
    // get the same "focus the current selection on open" treatment. Never both
    // active at once with the day-focus effect (mutually exclusive on `view`),
    // so they share `skipNextFocusGrid`/`inlineFocusReady` without conflict —
    // whichever one's `view` doesn't match just returns immediately, before
    // touching either flag.
    effect(() => {
      if (this.view() === 'date' || this.view() === 'time') return;
      const visible = this.open() || this.inline();
      if (!visible) return;
      if (this.inline() && !this.inlineFocusReady) {
        this.inlineFocusReady = true;
        return;
      }
      if (this.skipNextFocusGrid) {
        this.skipNextFocusGrid = false;
        return;
      }
      if (this.view() === 'month') {
        const buttons = this.monthViewButtons();
        if (buttons.length !== 12) return;
        const focused = this.focusedDate();
        const index =
          this.quickJumpYear() === focused.getFullYear()
            ? focused.getMonth()
            : 0;
        buttons[index]?.nativeElement.focus();
      } else {
        const buttons = this.yearGridButtons();
        if (buttons.length !== 12) return;
        const index = this.focusedDate().getFullYear() - this.yearGridStart();
        buttons[index]?.nativeElement.focus();
      }
    });

    // Keeps the visible month in sync with `value` for `inline` mode, which
    // has no `openPanel()` moment of its own to re-anchor `focusedDate` from
    // the current value the way opening the popup does.
    effect(() => {
      if (!this.inline()) return;
      const currentValue = this.value();
      const anchor = currentValue ?? startOfDay(new Date());
      const clamped = clampToRange(anchor, this.min(), this.max());
      this.focusedDate.set(clamped);
      if (this.view() === 'month') {
        this.quickJumpYear.set(clamped.getFullYear());
      }
      if (this.showTime() || this.view() === 'time') {
        this.seedTimeOfDay(currentValue);
      }
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  /** `gridMonth` is the specific grid's own anchor month (from `monthGrids()`),
   *  not always `visibleMonth()` — with `numberOfMonths > 1`, each grid dims
   *  its *own* leading/trailing adjacent-month days, not just the first grid's. */
  protected dayClasses(day: Date, gridMonth: Date): string {
    return cn(
      datePickerDayStyles({
        selected: this.isSelected(day),
        outsideMonth: !isSameMonth(day, gridMonth),
        today: this.isToday(day),
      }),
      this.ptFor('day').class,
    );
  }

  /** Full formatted date for screen readers — the visible button text is just the bare day number. */
  protected dayAriaLabel(day: Date): string {
    return getCachedDateTimeFormat(this.locale() ?? this.config.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(day);
  }

  protected isSelected(day: Date): boolean {
    if (this.selectionMode() === 'multiple') {
      return this.values().some((v) => isSameDay(v, day));
    }
    const value = this.value();
    return value !== null && isSameDay(day, value);
  }

  /** Drives the trigger's clear-button visibility — `value`-based in single
   *  mode, `values.length`-based in multiple mode. */
  protected readonly hasSelection = computed(() =>
    this.selectionMode() === 'multiple'
      ? this.values().length > 0
      : this.value() !== null,
  );

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

  /** Clicking the typable input always ensures the panel is open — never
   *  closes it (unlike the icon button's `toggle()`) — so clicking back into
   *  the field to fix a typo, once it's already open, doesn't unexpectedly
   *  snap the calendar shut. Doesn't move focus into the day grid (see
   *  `openPanel`'s `moveFocusToGrid` param) — stealing focus away from the
   *  input the instant it's clicked would make typing impossible. */
  protected onTriggerClick(): void {
    if (!this.open()) this.openPanel(false);
  }

  /** `moveFocusToGrid` gates the day-focus effect below via `skipNextFocusGrid`:
   *  a keyboard open (ArrowDown/Enter) or the icon button's `toggle()` still
   *  moves focus into the day grid (established roving-focus behavior), but a
   *  click on the input itself (see `onTriggerClick`) leaves focus there so
   *  the user can start typing immediately. */
  protected openPanel(moveFocusToGrid = true): void {
    if (this.disabled()) return;
    const currentValue = this.value();
    const anchor = currentValue ?? startOfDay(new Date());
    const clamped = clampToRange(anchor, this.min(), this.max());
    this.focusedDate.set(clamped);
    if (this.view() === 'month') {
      this.quickJumpYear.set(clamped.getFullYear());
    }
    if (this.showTime() || this.view() === 'time') {
      this.seedTimeOfDay(currentValue);
    }
    if (!moveFocusToGrid) {
      this.skipNextFocusGrid = true;
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
    if (this.selectionMode() === 'multiple') {
      this.toggleValue(day);
      return;
    }
    if (this.showTime()) {
      this.applyValue(this.composeDateTime(day, this.timeOfDay()));
    } else {
      this.commit(day);
    }
  }

  /** Adds/removes `day` from `values`, keeping the array sorted ascending.
   *  Unlike `commit`, does not close the panel or refocus the trigger — a
   *  multi-select pick stays open across clicks (closed via Escape, the icon
   *  button, or an outside click, same as PrimeNG's own multi-select Calendar). */
  private toggleValue(day: Date): void {
    const current = this.values();
    const exists = current.some((v) => isSameDay(v, day));
    const next = exists
      ? current.filter((v) => !isSameDay(v, day))
      : [...current, day].sort((a, b) => a.getTime() - b.getTime());
    this.applyValues(next);
  }

  protected navigateMonth(delta: number): void {
    this.moveFocus((date) => addMonths(date, delta));
  }

  /** Jumps to and selects today, clamped to min/max. In multiple mode, this
   *  *adds* today if it isn't already selected (a no-op if it already is) —
   *  deliberately not a toggle, since "Today" reads as an add action, not
   *  add/remove; single mode reuses `selectDay`'s existing
   *  readOnly/disabled-day/showTime handling verbatim, same as any other day
   *  click. */
  protected goToToday(): void {
    const today = clampToRange(startOfDay(new Date()), this.min(), this.max());
    if (this.selectionMode() === 'multiple') {
      if (this.readOnly() || this.isDisabled(today)) return;
      this.focusedDate.set(today);
      if (!this.values().some((v) => isSameDay(v, today))) {
        this.applyValues(
          [...this.values(), today].sort((a, b) => a.getTime() - b.getTime()),
        );
      }
      return;
    }
    this.selectDay(today);
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
    return getCachedDateTimeFormat(this.locale() ?? this.config.locale, {
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

  /** Commits a month (view: 'month') — unlike `selectQuickJumpMonth` (the
   *  *existing* date-view quick-jump grid, which only navigates), this is the
   *  primary selection action for that view: first-of-month, closes/commits
   *  like a day click. Reuses `quickJumpMonthClasses`/`isQuickJumpMonthDisabled`
   *  for styling/disabling — same grid, same `quickJumpYear` stepper, just a
   *  different top-level view with a different click outcome. */
  protected commitMonth(monthIndex: number): void {
    if (this.readOnly() || this.isQuickJumpMonthDisabled(monthIndex)) return;
    const target = clampToRange(
      new Date(this.quickJumpYear(), monthIndex, 1),
      this.min(),
      this.max(),
    );
    this.commit(target);
  }

  /** Steps the `view: 'year'` grid by a full 12-year block. */
  protected stepYearGrid(deltaYears: number): void {
    this.focusedDate.set(
      clampToRange(
        addYears(this.focusedDate(), deltaYears),
        this.min(),
        this.max(),
      ),
    );
  }

  protected yearButtonClasses(year: number): string {
    return datePickerMonthGridButtonStyles({
      current: year === this.focusedDate().getFullYear(),
    });
  }

  /** Same "entire unit outside [min, max]" posture as `isQuickJumpMonthDisabled`. */
  protected isYearDisabled(year: number): boolean {
    const min = this.min();
    const max = this.max();
    if (!min && !max) return false;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    if (max && isBefore(startOfDay(max), yearStart)) return true;
    if (min && isBefore(yearEnd, startOfDay(min))) return true;
    return false;
  }

  /** Commits a year (view: 'year') — Jan 1 of that year, closes/commits like a day click. */
  protected commitYear(year: number): void {
    if (this.readOnly() || this.isYearDisabled(year)) return;
    const target = clampToRange(new Date(year, 0, 1), this.min(), this.max());
    this.commit(target);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    // No ' ' case any more — the trigger is a real textbox now, so Space must
    // type a literal space (e.g. a locale format using one as a separator),
    // not open the calendar. Intentional behavior change from the old
    // button-based trigger.
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.typedDraft() !== null && this.typedDraft() !== '') {
        this.commitTypedDraft();
      } else if (!this.open()) {
        this.openPanel();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
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

  /** Reads the typed text (masking it first if `mask` is on, preserving caret
   *  position by re-deriving the masked prefix up to where the user was
   *  typing — same reslicing trick `@dynamong/input-mask` uses, since
   *  `applyDateMask` is a pure left-to-right re-derivation, not an
   *  incremental diff). */
  protected onTypedInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    if (!this.mask()) {
      this.typedDraft.set(raw);
      return;
    }
    const parts = this.activeFormatParts();
    const caretBefore = target.selectionStart ?? raw.length;
    const masked = applyDateMask(raw, parts);
    this.typedDraft.set(masked);
    const maskedPrefixLength = applyDateMask(
      raw.slice(0, caretBefore),
      parts,
    ).length;
    queueMicrotask(() => {
      target.setSelectionRange(maskedPrefixLength, maskedPrefixLength);
    });
  }

  /** Enter-to-commit: a valid draft applies and closes the panel; an invalid
   *  one is left as-is (the field stays focused so the user can fix it) —
   *  unlike blur, which reverts instead (see `onTriggerBlur`). */
  private commitTypedDraft(): void {
    const draft = this.typedDraft();
    if (draft === null) return;
    const parsed = parseDateString(draft, this.activeFormatParts());
    if (!parsed) return;
    const clamped = clampToRange(parsed, this.min(), this.max());
    this.focusedDate.set(clamped);
    this.applyValue(clamped);
    this.typedDraft.set(null);
    this.close();
  }

  protected onTriggerBlur(): void {
    const draft = this.typedDraft();
    if (draft !== null) {
      const parsed = parseDateString(draft, this.activeFormatParts());
      if (parsed) {
        const clamped = clampToRange(parsed, this.min(), this.max());
        this.focusedDate.set(clamped);
        this.applyValue(clamped);
      }
      // Unparseable text is discarded either way — `inputText` re-derives
      // from `value()` once `typedDraft` clears — same posture as
      // `@dynamong/input-mask`'s `autoClear`.
      this.typedDraft.set(null);
    }
    this.onTouchedFn();
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

  private applyValues(dates: Date[]): void {
    this.values.set(dates);
    this.onChangeFn(dates);
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
    if (this.selectionMode() === 'multiple') {
      this.values.set([]);
      this.onChangeFn([]);
      return;
    }
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

  writeValue(value: Date | Date[] | null): void {
    if (Array.isArray(value)) {
      this.values.set(value);
    } else {
      this.value.set(value);
    }
  }

  registerOnChange(fn: (value: Date | Date[] | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
