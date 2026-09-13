import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoRating),
      multi: true,
    },
  ],
})
export class DynamoRating
  extends DynamoBaseComponent<DynamoRatingPart>
  implements ControlValueAccessor
{
  readonly max = input(5);
  /** Two-way bindable: `<dg-rating [(value)]="stars">`. Also driven by Angular forms via `writeValue`. */
  readonly value = model(0);
  readonly readOnly = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly size = input<DynamoSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);

  private onChangeFn: (value: number) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

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
    const next = this.value() === star ? 0 : star;
    this.value.set(next);
    this.onChangeFn(next);
    this.onTouchedFn();
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

  protected onBlur(): void {
    this.onTouchedFn();
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
    this.onChangeFn(next);
    this.onTouchedFn();
  }

  writeValue(value: number | null): void {
    this.value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
