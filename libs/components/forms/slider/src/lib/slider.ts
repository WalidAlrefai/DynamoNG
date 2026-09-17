import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  sliderFillStyles,
  sliderRootStyles,
  sliderThumbStyles,
  sliderTrackStyles,
} from './slider.styles';
import type { DynamoSliderPart, DynamoSliderRange } from './slider.types';

@Component({
  selector: 'dg-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slider.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoSlider),
      multi: true,
    },
  ],
})
export class DynamoSlider
  extends DynamoBaseComponent<DynamoSliderPart>
  implements ControlValueAccessor
{
  /**
   * Two-way bindable: `<dg-slider [(value)]="amount">`. Also driven by
   * Angular forms via `writeValue`. Becomes a `DynamoSliderRange`
   * (`{minValue, maxValue}`) when `range` is `true` — see the `range`
   * input's own doc comment.
   */
  readonly value = model<number | DynamoSliderRange>(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  /**
   * Opt-in — renders two independently-draggable thumbs instead of one,
   * and `value` becomes a `DynamoSliderRange` instead of a plain number
   * (mirrors PrimeNG's own `p-slider[range]`). Thumbs can touch but never
   * cross (the min-thumb's value can never exceed the max-thumb's, and
   * vice versa) — see `clampPair`. Track-click-to-jump is intentionally
   * NOT supported here (a bare track click is ambiguous about which
   * thumb should respond); only dragging a handle directly, or its own
   * keyboard interaction, moves it.
   */
  readonly range = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the thumb stays visible/focusable, but
   *  dragging and keyboard changes are both blocked. Unlike `disabled`,
   *  doesn't dim the track or remove it from the tab order. */
  readonly readOnly = input(false);
  readonly size = input<DynamoSize>('md');
  readonly severity = input<DynamoSeverity>('primary');
  readonly ariaLabel = input<string | undefined>(undefined);

  private onChangeFn: (value: number | DynamoSliderRange) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  private readonly trackRef =
    viewChild.required<ElementRef<HTMLElement>>('track');
  // Not `.required()` — only renders in the non-range template branch.
  // Range mode's thumbs focus themselves directly via `event.currentTarget`
  // in `onThumbPointerDown`, so they need no refs of their own.
  private readonly thumbRef = viewChild<ElementRef<HTMLElement>>('thumb');

  protected readonly dragging = signal(false);
  private dragThumb: 'min' | 'max' | null = null;

  // Single source of truth for both the ARIA attrs and the fill/thumb
  // position — derived once so they can never disagree, even for an
  // out-of-range, NaN-adjacent, or non-step-aligned `value` (mirrors
  // Progress's clampedValue). Non-range mode only — untouched by `range`.
  protected readonly clampedValue = computed(() =>
    this.clamp(this.value() as number),
  );
  protected readonly percent = computed(() => {
    const range = this.max() - this.min();
    return range > 0 ? ((this.clampedValue() - this.min()) / range) * 100 : 0;
  });

  // Range mode's own parallel pair — kept genuinely separate from
  // `clampedValue`/`percent` above rather than unified, so non-range
  // behavior stays byte-for-byte identical to before `range` existed.
  protected readonly currentMin = computed(() => {
    const value = this.value();
    const minValue = this.isRangeValue(value) ? value.minValue : this.min();
    return this.clampPair(minValue, 'min');
  });
  protected readonly currentMax = computed(() => {
    const value = this.value();
    const maxValue = this.isRangeValue(value) ? value.maxValue : this.max();
    return this.clampPair(maxValue, 'max');
  });
  protected readonly percentMin = computed(() => {
    const span = this.max() - this.min();
    return span > 0 ? ((this.currentMin() - this.min()) / span) * 100 : 0;
  });
  protected readonly percentMax = computed(() => {
    const span = this.max() - this.min();
    return span > 0 ? ((this.currentMax() - this.min()) / span) * 100 : 0;
  });

  protected readonly minThumbLabel = computed(
    () => `${this.ariaLabel() ?? 'Slider'} minimum`,
  );
  protected readonly maxThumbLabel = computed(
    () => `${this.ariaLabel() ?? 'Slider'} maximum`,
  );

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(sliderRootStyles, this.styleClass()),
  );
  protected readonly trackClasses = computed(() =>
    sliderTrackStyles({ size: this.size(), disabled: this.disabled() }),
  );
  protected readonly fillClasses = computed(() =>
    sliderFillStyles({ severity: this.severity() }),
  );
  protected readonly thumbClasses = computed(() =>
    sliderThumbStyles({
      size: this.size(),
      severity: this.severity(),
      disabled: this.disabled(),
    }),
  );

  private clamp(raw: number): number {
    if (Number.isNaN(raw)) {
      return this.min();
    }
    return Math.min(this.max(), Math.max(this.min(), this.snapToStep(raw)));
  }

  private snapToStep(raw: number): number {
    const step = this.step();
    if (step <= 0) {
      return raw;
    }
    const min = this.min();
    return Math.round((raw - min) / step) * step + min;
  }

  private isRangeValue(
    value: number | DynamoSliderRange,
  ): value is DynamoSliderRange {
    return typeof value === 'object' && value !== null;
  }

  /**
   * Applies the existing single-value `clamp()` (NaN-guard + step-snap +
   * min/max bound) unchanged, then — range mode only — additionally
   * clamps against the OTHER thumb's current raw value so the min-thumb
   * can never exceed the max-thumb and vice versa. Gap is 0 (thumbs may
   * touch), matching PrimeNG's own default; no configurable gap in v1.
   */
  private clampPair(raw: number, thumb: 'min' | 'max'): number {
    const base = this.clamp(raw);
    if (!this.range()) {
      return base;
    }
    const value = this.value();
    const other = this.isRangeValue(value)
      ? thumb === 'min'
        ? value.maxValue
        : value.minValue
      : thumb === 'min'
        ? this.max()
        : this.min();
    return thumb === 'min' ? Math.min(base, other) : Math.max(base, other);
  }

  protected onThumbKeydown(thumb: 'min' | 'max', event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    const step = this.step();
    const current = !this.range()
      ? this.clampedValue()
      : thumb === 'min'
        ? this.currentMin()
        : this.currentMax();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - step;
        break;
      case 'PageUp':
        next = current + step * 10;
        break;
      case 'PageDown':
        next = current - step * 10;
        break;
      case 'Home':
        next = this.min();
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.commitThumb(thumb, next);
  }

  // Both click-to-jump and drag are handled here rather than split between
  // track and thumb — the thumb's position is purely derived from `value`,
  // so one pointer region (matching Carousel's viewport) covers both.
  // Non-range mode only — range mode's pointerdown lives on each thumb
  // instead (`onThumbPointerDown`), since a bare track click is ambiguous
  // about which handle should respond.
  protected onTrackPointerDown(event: PointerEvent): void {
    if (this.range() || this.disabled() || this.readOnly()) {
      return;
    }
    this.dragging.set(true);
    this.updateFromClientX('min', event.clientX);
    this.thumbRef()?.nativeElement.focus();
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as Carousel's pointer-drag.
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  /** Range mode only — bound to each thumb's own `(pointerdown)`. */
  protected onThumbPointerDown(
    thumb: 'min' | 'max',
    event: PointerEvent,
  ): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    this.dragThumb = thumb;
    (event.currentTarget as HTMLElement).focus();
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as Carousel's pointer-drag.
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
    // Don't also let this bubble into the track's own pointerdown handling.
    event.stopPropagation();
  }

  protected onTrackPointerMove(event: PointerEvent): void {
    if (this.range()) {
      if (!this.dragThumb) {
        return;
      }
      this.updateFromClientX(this.dragThumb, event.clientX);
      return;
    }
    if (!this.dragging()) {
      return;
    }
    this.updateFromClientX('min', event.clientX);
  }

  protected onTrackPointerUp(): void {
    if (this.dragging() || this.dragThumb) {
      this.onTouchedFn();
    }
    this.dragging.set(false);
    this.dragThumb = null;
  }

  private updateFromClientX(thumb: 'min' | 'max', clientX: number): void {
    const rect = this.trackRef().nativeElement.getBoundingClientRect();
    const ratio =
      rect.width > 0
        ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
        : 0;
    this.commitThumb(thumb, this.min() + ratio * (this.max() - this.min()));
  }

  private commit(next: number): void {
    this.value.set(next);
    this.onChangeFn(next);
  }

  private commitRange(next: DynamoSliderRange): void {
    this.value.set(next);
    this.onChangeFn(next);
  }

  /**
   * Shared by keyboard and pointer handlers — `thumb` is inert in
   * non-range mode (always short-circuits to the plain `commit()` path),
   * so the single existing thumb can keep calling this with a literal
   * `'min'` without ever actually branching into range-shaped commits.
   */
  private commitThumb(thumb: 'min' | 'max', next: number): void {
    const clamped = this.clampPair(next, thumb);
    if (!this.range()) {
      this.commit(clamped);
      return;
    }
    this.commitRange({
      minValue: thumb === 'min' ? clamped : this.currentMin(),
      maxValue: thumb === 'max' ? clamped : this.currentMax(),
    });
  }

  writeValue(value: number | DynamoSliderRange | null): void {
    this.value.set(
      value ??
        (this.range() ? { minValue: this.min(), maxValue: this.max() } : 0),
    );
  }

  registerOnChange(fn: (value: number | DynamoSliderRange) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
