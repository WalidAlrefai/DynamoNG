import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  sliderFillStyles,
  sliderRootStyles,
  sliderThumbStyles,
  sliderTrackStyles,
} from './slider.styles';
import type { DynamoSliderPart } from './slider.types';

@Component({
  selector: 'dg-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slider.html',
})
export class DynamoSlider extends DynamoBaseComponent<DynamoSliderPart> {
  /** Two-way bindable: `<dg-slider [(value)]="amount">`. */
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly disabled = input(false);
  readonly size = input<DynamoSize>('md');
  readonly severity = input<DynamoSeverity>('primary');
  readonly ariaLabel = input<string | undefined>(undefined);

  private readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly thumbRef = viewChild.required<ElementRef<HTMLElement>>('thumb');

  protected readonly dragging = signal(false);

  // Single source of truth for both the ARIA attrs and the fill/thumb
  // position — derived once so they can never disagree, even for an
  // out-of-range, NaN-adjacent, or non-step-aligned `value` (mirrors
  // Progress's clampedValue).
  protected readonly clampedValue = computed(() => this.clamp(this.value()));
  protected readonly percent = computed(() => {
    const range = this.max() - this.min();
    return range > 0 ? ((this.clampedValue() - this.min()) / range) * 100 : 0;
  });

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

  protected onThumbKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const step = this.step();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = this.clampedValue() + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = this.clampedValue() - step;
        break;
      case 'PageUp':
        next = this.clampedValue() + step * 10;
        break;
      case 'PageDown':
        next = this.clampedValue() - step * 10;
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
    this.value.set(this.clamp(next));
  }

  // Both click-to-jump and drag are handled here rather than split between
  // track and thumb — the thumb's position is purely derived from `value`,
  // so one pointer region (matching Carousel's viewport) covers both.
  protected onTrackPointerDown(event: PointerEvent): void {
    if (this.disabled()) {
      return;
    }
    this.dragging.set(true);
    this.updateFromClientX(event.clientX);
    this.thumbRef().nativeElement.focus();
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as Carousel's pointer-drag.
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  protected onTrackPointerMove(event: PointerEvent): void {
    if (!this.dragging()) {
      return;
    }
    this.updateFromClientX(event.clientX);
  }

  protected onTrackPointerUp(): void {
    this.dragging.set(false);
  }

  private updateFromClientX(clientX: number): void {
    const rect = this.trackRef().nativeElement.getBoundingClientRect();
    const ratio =
      rect.width > 0
        ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
        : 0;
    this.value.set(this.clamp(this.min() + ratio * (this.max() - this.min())));
  }
}
