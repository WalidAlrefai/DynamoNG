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
  inputNumberButtonStyles,
  inputNumberInputStyles,
  inputNumberWrapperStyles,
} from './input-number.styles';
import type { DynamoInputNumberPart } from './input-number.types';

@Component({
  selector: 'dg-input-number',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-number.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoInputNumber),
      multi: true,
    },
  ],
})
export class DynamoInputNumber
  extends DynamoBaseComponent<DynamoInputNumberPart>
  implements ControlValueAccessor
{
  readonly size = input<DynamoSize>('md');
  readonly placeholder = input('');
  readonly invalid = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input(1);

  protected readonly value = signal<number | null>(null);
  // Live keystrokes while focused, kept separate from `value` so partial
  // input ("-", "12.") isn't clobbered by a re-render before the user
  // finishes typing — parsing/clamping only happens in commit(), on blur.
  protected readonly editingText = signal<string | null>(null);

  private onChangeFn: (value: number | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly displayValue = computed(
    () => this.editingText() ?? this.formatValue(this.value()),
  );

  protected readonly incrementDisabled = computed(() => {
    const max = this.max();
    return this.disabled() || (max != null && (this.value() ?? 0) >= max);
  });
  protected readonly decrementDisabled = computed(() => {
    const min = this.min();
    return this.disabled() || (min != null && (this.value() ?? 0) <= min);
  });

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          inputNumberWrapperStyles({
            size: this.size(),
            invalid: this.invalid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly inputClasses = inputNumberInputStyles;
  protected readonly buttonClasses = computed(() =>
    inputNumberButtonStyles({ size: this.size() }),
  );

  writeValue(value: number | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onFocus(): void {
    this.editingText.set(this.formatValue(this.value()));
  }

  protected onInput(event: Event): void {
    this.editingText.set((event.target as HTMLInputElement).value);
  }

  protected onBlur(): void {
    this.commit(this.editingText());
    this.editingText.set(null);
    this.onTouchedFn();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const step = this.step();
    const current = this.value() ?? 0;
    let next: number | undefined;
    switch (event.key) {
      case 'ArrowUp':
        next = current + step;
        break;
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
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    this.editingText.set(null);
    this.setValue(this.clamp(next));
  }

  protected increment(): void {
    if (this.incrementDisabled()) {
      return;
    }
    this.setValue(this.clamp((this.value() ?? 0) + this.step()));
  }

  protected decrement(): void {
    if (this.decrementDisabled()) {
      return;
    }
    this.setValue(this.clamp((this.value() ?? 0) - this.step()));
  }

  protected formatValue(value: number | null): string {
    return value === null ? '' : String(value);
  }

  private commit(text: string | null): void {
    if (text == null || text.trim() === '') {
      this.setValue(null);
      return;
    }
    const parsed = Number(text);
    if (Number.isNaN(parsed)) {
      // Reverts the display to the last committed value without emitting
      // a change — unparseable text is discarded, not propagated as NaN.
      return;
    }
    this.setValue(this.clamp(parsed));
  }

  private setValue(next: number | null): void {
    this.value.set(next);
    this.onChangeFn(next);
  }

  private clamp(raw: number): number {
    let result = this.snapToStep(raw);
    const min = this.min();
    const max = this.max();
    if (min != null) {
      result = Math.max(min, result);
    }
    if (max != null) {
      result = Math.min(max, result);
    }
    return result;
  }

  private snapToStep(raw: number): number {
    const step = this.step();
    if (step <= 0) {
      return raw;
    }
    const base = this.min() ?? 0;
    return Math.round((raw - base) / step) * step + base;
  }
}
