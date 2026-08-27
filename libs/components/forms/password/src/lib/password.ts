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
import { DynamoProgress } from '@dynamong/progress';
import { cn } from '@dynamong/utils/class-merge';
import { calculatePasswordStrength } from './password-strength';
import {
  passwordInputStyles,
  passwordToggleButtonStyles,
  passwordWrapperStyles,
} from './password.styles';
import type { DynamoPasswordPart } from './password.types';

@Component({
  selector: 'dg-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoProgress],
  templateUrl: './password.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoPassword),
      multi: true,
    },
  ],
})
export class DynamoPassword extends DynamoBaseComponent<DynamoPasswordPart> implements ControlValueAccessor {
  readonly size = input<DynamoSize>('md');
  readonly placeholder = input('');
  readonly invalid = input(false);
  /** Accessible name for the input when no visible `<label>` wraps it. */
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly showStrengthMeter = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);

  protected readonly value = signal('');
  protected readonly visible = signal(false);

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly inputType = computed(() => (this.visible() ? 'text' : 'password'));
  protected readonly toggleLabel = computed(() =>
    this.visible() ? 'Hide password' : 'Show password',
  );
  protected readonly strength = computed(() => calculatePasswordStrength(this.value()));
  protected readonly meterId = this.idGenerator.next('dg-password-meter');

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          passwordWrapperStyles({
            size: this.size(),
            invalid: this.invalid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly inputClasses = passwordInputStyles;
  protected readonly toggleButtonClasses = passwordToggleButtonStyles;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChangeFn(target.value);
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  protected toggleVisibility(): void {
    this.visible.update((v) => !v);
  }
}
