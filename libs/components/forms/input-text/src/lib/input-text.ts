import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { inputTextStyles } from './input-text.styles';
import type { DynamoInputTextPart, DynamoInputTextSize, DynamoInputTextType } from './input-text.types';

@Component({
  selector: 'dg-input-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-text.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoInputText),
      multi: true,
    },
  ],
})
export class DynamoInputText extends DynamoBaseComponent<DynamoInputTextPart> implements ControlValueAccessor {
  readonly type = input<DynamoInputTextType>('text');
  readonly size = input<DynamoInputTextSize>('md');
  readonly placeholder = input('');
  readonly invalid = input(false);
  /** Accessible name for the input when no visible `<label>` wraps it (e.g. a bare search box). */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the current value stays visible and the control
   *  stays focusable/tabbable, but the user cannot change it. Unlike `disabled`,
   *  does not remove the control from the tab order or dim its appearance. */
  readonly readOnly = input(false);

  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model('');

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly inputClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(inputTextStyles({ size: this.size(), invalid: this.invalid() }), this.styleClass()),
  );

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
}
