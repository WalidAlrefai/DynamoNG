import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  ratingRootStyles,
  ratingStarButtonStyles,
  ratingStarStyles,
} from './rating.styles';
import type { DynamoRatingPart } from './rating.types';

@Component({
  selector: 'dg-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating.html',
})
export class DynamoRating extends DynamoBaseComponent<DynamoRatingPart> {
  readonly max = input(5);
  /** Two-way bindable: `<dg-rating [(value)]="stars">`. */
  readonly value = model(0);
  readonly readOnly = input(false);
  readonly disabled = input(false);
  readonly size = input<DynamoSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly stars = computed(() =>
    Array.from({ length: Math.max(0, this.max()) }, (_, i) => i + 1),
  );

  // Hover preview overrides the committed value for display only — same
  // "derive display from one source of truth" reasoning as Slider's
  // clampedValue/percent split.
  protected readonly hoverValue = signal<number | null>(null);
  protected readonly displayValue = computed(
    () => this.hoverValue() ?? this.value(),
  );

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(ratingRootStyles({ disabled: this.disabled() }), this.styleClass()),
  );
  protected readonly starButtonClasses = ratingStarButtonStyles;

  protected isFilled(star: number): boolean {
    return star <= this.displayValue();
  }

  protected starClasses(star: number) {
    return ratingStarStyles({
      size: this.size(),
      filled: this.isFilled(star),
      interactive: !this.disabled() && !this.readOnly(),
    });
  }

  protected onStarClick(star: number): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    this.value.set(this.value() === star ? 0 : star);
  }

  protected onStarMouseEnter(star: number): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    this.hoverValue.set(star);
  }

  protected onMouseLeave(): void {
    this.hoverValue.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    let next: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(this.max(), this.value() + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(0, this.value() - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.value.set(next);
  }
}
