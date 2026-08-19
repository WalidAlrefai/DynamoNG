import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import { cn } from '@dynamong/utils/class-merge';
import {
  addDays,
  addMonths,
  addYears,
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
import {
  datePickerDayStyles,
  datePickerHeaderButtonStyles,
  datePickerPanelStyles,
  datePickerTriggerStyles,
  datePickerWeekdayStyles,
} from './date-picker.styles';
import type {
  DynamoDatePickerPart,
  DynamoDatePickerSize,
} from './date-picker.types';

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

@Component({
  selector: 'dg-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  extends DynamoBaseComponent<DynamoDatePickerPart>
  implements ControlValueAccessor
{
  readonly placeholder = input('Select a date');
  readonly size = input<DynamoDatePickerSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);
  readonly weekStartsOn = input<DynamoDatePickerWeekday>(0);

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
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly triggerId = this.idGenerator.next(
    'dg-date-picker-trigger',
  );
  protected readonly dialogId = this.idGenerator.next('dg-date-picker-dialog');
  protected readonly monthLabelId = `${this.dialogId}-month-label`;

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;

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

  protected readonly triggerLabel = computed(() => {
    const value = this.value();
    return value
      ? new Intl.DateTimeFormat(this.config.locale, {
          dateStyle: 'medium',
        }).format(value)
      : this.placeholder();
  });
  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.config.locale, {
      month: 'long',
      year: 'numeric',
    }).format(this.visibleMonth()),
  );
  protected readonly weekdayLabels = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.config.locale, {
      weekday: 'short',
    });
    return this.calendarDays()
      .slice(0, 7)
      .map((day) => formatter.format(day));
  });

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(datePickerTriggerStyles({ size: this.size() }), this.styleClass()),
  );
  protected readonly panelClasses = datePickerPanelStyles;
  protected readonly headerButtonClasses = datePickerHeaderButtonStyles;
  protected readonly weekdayClasses = datePickerWeekdayStyles;

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
    effect(() => {
      if (!this.open()) return;
      const days = this.calendarDays();
      const buttons = this.dayButtons();
      if (buttons.length !== days.length) return;
      const index = days.findIndex((day) => isSameDay(day, this.focusedDate()));
      buttons[index]?.nativeElement.focus();
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

  protected isSelected(day: Date): boolean {
    const value = this.value();
    return value !== null && isSameDay(day, value);
  }

  protected isToday(day: Date): boolean {
    return dateFnsIsToday(day);
  }

  protected isDisabled(day: Date): boolean {
    return isDateDisabled(day, this.min(), this.max());
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
    const anchor = this.value() ?? startOfDay(new Date());
    this.focusedDate.set(clampToRange(anchor, this.min(), this.max()));
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    this.onTouchedFn();
  }

  protected selectDay(day: Date): void {
    if (this.isDisabled(day)) return;
    this.focusedDate.set(day);
    this.commit(day);
  }

  protected navigateMonth(delta: number): void {
    this.moveFocus((date) => addMonths(date, delta));
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
    this.value.set(normalized);
    this.onChangeFn(normalized);
    this.close();
    this.triggerEl().nativeElement.focus();
  }

  private attachOverlay(): void {
    if (!this.overlayHandle) {
      const handle = this.overlayService.createConnectedOverlay(
        this.triggerEl().nativeElement,
        POSITIONS,
        {
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-transparent-backdrop',
        },
      );
      handle.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.close());
      this.overlayHandle = handle;
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.panelTemplate(),
        this.viewContainerRef,
      );
    }

    if (!this.overlayHandle.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.attach(this.portal);
    }
  }

  private detachOverlay(): void {
    if (this.overlayHandle?.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.detach();
    }
  }

  private destroyOverlay(): void {
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.portal = null;
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
