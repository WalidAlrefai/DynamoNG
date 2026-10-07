import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnInit,
  computed,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Directionality } from '@angular/cdk/bidi';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  sliderFillStyles,
  sliderRootStyles,
  sliderThumbStyles,
  sliderTickLabelStyles,
  sliderTickStyles,
  sliderTooltipStyles,
  sliderTrackStyles,
} from './slider.styles';
import type {
  DynamoSliderOrientation,
  DynamoSliderPart,
  DynamoSliderRange,
} from './slider.types';

@Component({
  selector: 'dg-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slider.html',
  imports: [DynamoPassThroughDirective],
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
  implements ControlValueAccessor, OnInit
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
  /** Overrides `step` for keyboard Arrow/Page increments only. Unset falls
   *  back to `step()` — zero behavior change by default. Pointer-drag
   *  snapping always uses `step()`, never this. */
  readonly keyboardStep = input<number | undefined>(undefined);
  /**
   * Opt-in — renders two independently-draggable thumbs instead of one,
   * and `value` becomes a `DynamoSliderRange` instead of a plain number.
   * Thumbs can touch but never cross (the min-thumb's value can never
   * exceed the max-thumb's, and vice versa) — see `clampPair`.
   * Track-click-to-jump is intentionally NOT supported here (a bare track
   * click is ambiguous about which thumb should respond); only dragging a
   * handle directly, or its own keyboard interaction, moves it.
   */
  readonly range = input(false);
  /** Range mode only. Minimum distance enforced between the two thumbs —
   *  default `0` preserves the original "can touch, never cross" behavior
   *  exactly. */
  readonly minRange = input(0);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the thumb stays visible/focusable, but
   *  dragging and keyboard changes are both blocked. Unlike `disabled`,
   *  doesn't dim the track or remove it from the tab order. */
  readonly readOnly = input(false);
  readonly size = input<DynamoSize>('md');
  readonly severity = input<DynamoSeverity>('primary');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the thumb (both thumbs, in range mode). */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `true`; the root was already
   *  unconditionally full-width in horizontal orientation before this input
   *  existed, so this is a pure opt-out, not a behavior change. Vertical
   *  orientation is untouched — its footprint is intrinsic. */
  readonly fluid = input(true);
  /** `'vertical'` renders a bottom-anchored track that grows upward, matching a volume-slider convention. Keyboard arrows are unaffected — Right/Up already increment and Left/Down already decrement in both orientations. */
  readonly orientation = input<DynamoSliderOrientation>('horizontal');
  /** Track height in px — only consulted while `orientation` is `'vertical'`; there's no natural intrinsic height for a vertical track (same reasoning as VirtualScroll's own `height` input). */
  readonly verticalHeight = input(200);
  /** Renders a small dot at every `step` increment from `min` to `max`. Ignored (`tickValues` used instead) when that's also set. */
  readonly showTicks = input(false);
  /** Explicit, sparse tick positions (e.g. `[0, 25, 50, 75, 100]`), overriding `showTicks`' step-based generation. Values outside `[min, max]` are dropped. */
  readonly tickValues = input<number[] | undefined>(undefined);
  /** Renders each tick's numeric value as a label. Orthogonal to both
   *  `showTicks` and `tickValues` — reuses whichever set of tick positions
   *  they produce. */
  readonly showTickLabels = input(false);
  /**
   * Shows the live value in a small bubble while a thumb is actively being
   * dragged (not on plain keyboard focus — a deliberate scope cut, same as
   * Rating's own documented scope cuts: this mirrors common slider UX where
   * the bubble is a drag affordance, not a permanent value readout).
   */
  readonly showTooltip = input(false);

  private onChangeFn: (value: number | DynamoSliderRange) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  private readonly directionality = inject(Directionality);

  private readonly trackRef =
    viewChild.required<ElementRef<HTMLElement>>('track');
  // Not `.required()` — only renders in the non-range template branch.
  // Range mode's thumbs focus themselves directly via `event.currentTarget`
  // in `onThumbPointerDown`, so they need no refs of their own.
  private readonly thumbRef = viewChild<ElementRef<HTMLElement>>('thumb');

  protected readonly dragging = signal(false);
  // A signal, not a plain field, so `showTooltipFor` can react to it — the
  // rest of its usage (drag routing) doesn't otherwise need reactivity.
  private readonly dragThumb = signal<'min' | 'max' | null>(null);

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
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          sliderRootStyles({
            orientation: this.orientation(),
            fluid: this.fluid(),
          }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly trackClasses = computed(() =>
    cn(
      sliderTrackStyles({
        size: this.size(),
        disabled: this.disabled(),
        orientation: this.orientation(),
      }),
      this.ptFor('track').class,
    ),
  );
  protected readonly fillClasses = computed(() =>
    cn(
      sliderFillStyles({
        severity: this.severity(),
        orientation: this.orientation(),
      }),
      this.ptFor('fill').class,
    ),
  );
  protected readonly thumbClasses = computed(() =>
    cn(
      sliderThumbStyles({
        size: this.size(),
        severity: this.severity(),
        disabled: this.disabled(),
        orientation: this.orientation(),
      }),
      this.ptFor('thumb').class,
    ),
  );
  protected readonly tickClasses = computed(() =>
    cn(
      sliderTickStyles({ orientation: this.orientation() }),
      this.ptFor('tick').class,
    ),
  );
  protected readonly tickLabelClasses = computed(() =>
    cn(
      sliderTickLabelStyles({ orientation: this.orientation() }),
      this.ptFor('tickLabel').class,
    ),
  );
  protected readonly tooltipClasses = computed(() =>
    sliderTooltipStyles({ orientation: this.orientation() }),
  );

  /**
   * Explicit `tickValues` win outright; otherwise one tick per `step` across
   * `[min, max]` while `showTicks` is on (empty array — nothing rendered —
   * otherwise). Generated by index*step, not repeated addition, so a
   * fractional `step` can't drift off exact tick positions.
   */
  protected readonly ticks = computed<number[]>(() => {
    const lo = this.min();
    const hi = this.max();
    const explicit = this.tickValues();
    if (explicit) {
      return explicit.filter((value) => value >= lo && value <= hi);
    }
    if (!this.showTicks() || hi <= lo) {
      return [];
    }
    const step = this.step();
    if (step <= 0) {
      return [lo, hi];
    }
    const count = Math.floor((hi - lo) / step);
    const values = Array.from({ length: count + 1 }, (_, i) => lo + i * step);
    if (values[values.length - 1] !== hi) {
      values.push(hi);
    }
    return values;
  });

  ngOnInit(): void {
    if (!isDevMode()) return;
    if (this.showTicks() && !this.tickValues() && this.ticks().length > 50) {
      console.warn(
        this.showTickLabels()
          ? '[dg-slider] `showTicks` generated more than 50 tick marks from `step`, each with its own label — consider passing `tickValues` for a sparse, explicit set instead.'
          : '[dg-slider] `showTicks` generated more than 50 tick marks from `step` — consider passing `tickValues` for a sparse, explicit set instead.',
      );
    }
    if (this.range() && this.minRange() > this.max() - this.min()) {
      console.warn(
        "[dg-slider] `minRange` exceeds the slider's overall span (max - min) — thumbs will clamp to the slider's bounds rather than maintaining the full requested gap.",
      );
    }
  }

  protected tickPercent(value: number): number {
    const range = this.max() - this.min();
    return range > 0 ? ((value - this.min()) / range) * 100 : 0;
  }

  /** `[style]` object for the tick dot / fill / thumb along whichever axis `orientation` is currently on. */
  protected percentStyle(
    percent: number,
    dimension?: number,
  ): Record<string, string> {
    // insetInlineStart, not left: a logical CSS property that the browser
    // auto-mirrors under dir="rtl" with zero JS direction detection needed —
    // vertical's `bottom` is untouched, since the block axis has no RTL
    // concern (only the inline/horizontal axis does).
    const axis =
      this.orientation() === 'vertical' ? 'bottom' : 'insetInlineStart';
    const style: Record<string, string> = { [axis]: `${percent}%` };
    if (dimension !== undefined) {
      style[this.orientation() === 'vertical' ? 'height' : 'width'] =
        `${dimension}%`;
    }
    return style;
  }

  protected fillStyle(): Record<string, string> {
    if (!this.range()) {
      return this.orientation() === 'vertical'
        ? { height: `${this.percent()}%` }
        : { width: `${this.percent()}%` };
    }
    return this.percentStyle(
      this.percentMin(),
      this.percentMax() - this.percentMin(),
    );
  }

  protected thumbStyle(thumb: 'min' | 'max'): Record<string, string> {
    const percent = !this.range()
      ? this.percent()
      : thumb === 'min'
        ? this.percentMin()
        : this.percentMax();
    return this.percentStyle(percent);
  }

  protected showTooltipFor(thumb: 'min' | 'max'): boolean {
    if (!this.showTooltip()) return false;
    return this.range() ? this.dragThumb() === thumb : this.dragging();
  }

  // Bounds + NaN-guard only — grid-snapping is the caller's job (see
  // snapToStep), applied once at commit time with whichever grid that
  // specific commit origin uses (step() for drag, keyboardStep() ?? step()
  // for keyboard). This also means display (clampedValue/currentMin/
  // currentMax, below) never re-grids an already-stored value onto step()'s
  // grid — needed so a keyboardStep()-grid value displays correctly instead
  // of silently snapping back onto step()'s grid for render purposes only.
  private clamp(raw: number): number {
    if (Number.isNaN(raw)) {
      return this.min();
    }
    return Math.min(this.max(), Math.max(this.min(), raw));
  }

  private snapToStep(raw: number, step: number): number {
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
   * Applies the existing single-value `clamp()` (NaN-guard + min/max bound
   * — `raw` is expected to already be snapped to whichever grid the caller
   * wants) unchanged, then — range mode only — additionally clamps against
   * the OTHER thumb's current raw value, offset by `minRange()`, so the
   * min-thumb can never come within that distance of the max-thumb and vice
   * versa. `minRange` defaults to `0` (thumbs may touch but never cross —
   * the original behavior, unchanged).
   */
  private clampPair(raw: number, thumb: 'min' | 'max'): number {
    const base = this.clamp(raw);
    if (!this.range()) {
      return base;
    }
    const gap = Math.max(0, this.minRange());
    const value = this.value();
    const other = this.isRangeValue(value)
      ? thumb === 'min'
        ? value.maxValue
        : value.minValue
      : thumb === 'min'
        ? this.max()
        : this.min();
    return thumb === 'min'
      ? Math.min(base, Math.max(this.min(), other - gap))
      : Math.max(base, Math.min(this.max(), other + gap));
  }

  protected onThumbKeydown(thumb: 'min' | 'max', event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    const step = this.keyboardStep() ?? this.step();
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
    this.commitThumb(thumb, next, step);
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
    this.updateFromClientCoord('min', event);
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
    this.dragThumb.set(thumb);
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
    if (this.disabled() || this.readOnly()) {
      // Ends the drag cleanly rather than merely ignoring further moves —
      // otherwise showTooltipFor() would keep rendering a frozen, stale
      // tooltip indefinitely on a now-disabled/readOnly slider until some
      // future pointerup happens to arrive, which isn't guaranteed (pointer
      // capture behavior under a mid-drag disabled flip is inconsistent
      // across browsers). No onTouchedFn() call — no value changed, matching
      // onThumbKeydown's own disabled/readOnly guard.
      this.dragging.set(false);
      this.dragThumb.set(null);
      return;
    }
    if (this.range()) {
      const thumb = this.dragThumb();
      if (!thumb) {
        return;
      }
      this.updateFromClientCoord(thumb, event);
      return;
    }
    if (!this.dragging()) {
      return;
    }
    this.updateFromClientCoord('min', event);
  }

  protected onTrackPointerUp(): void {
    if (this.dragging() || this.dragThumb()) {
      this.onTouchedFn();
    }
    this.dragging.set(false);
    this.dragThumb.set(null);
  }

  private updateFromClientCoord(
    thumb: 'min' | 'max',
    event: PointerEvent,
  ): void {
    const rect = this.trackRef().nativeElement.getBoundingClientRect();
    // CSS logical properties alone can't fix drag math — event.clientX is
    // always a physical viewport coordinate, so direction has to be read
    // explicitly here to know which edge "increasing value" drags toward.
    const isRtl = this.directionality.value === 'rtl';
    const ratio =
      this.orientation() === 'vertical'
        ? rect.height > 0
          ? Math.min(
              1,
              Math.max(0, (rect.bottom - event.clientY) / rect.height),
            )
          : 0
        : rect.width > 0
          ? Math.min(
              1,
              Math.max(
                0,
                isRtl
                  ? (rect.right - event.clientX) / rect.width
                  : (event.clientX - rect.left) / rect.width,
              ),
            )
          : 0;
    this.commitThumb(
      thumb,
      this.min() + ratio * (this.max() - this.min()),
      this.step(),
    );
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
   * `step` is the grid this specific commit snaps to — keyboard passes
   * `keyboardStep() ?? step()`, pointer-drag always passes `step()`.
   */
  private commitThumb(thumb: 'min' | 'max', next: number, step: number): void {
    const snapped = this.snapToStep(next, step);
    const clamped = this.clampPair(snapped, thumb);
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
