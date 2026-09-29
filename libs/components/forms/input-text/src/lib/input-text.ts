import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { inputTextStyles } from './input-text.styles';
import type {
  DynamoInputTextPart,
  DynamoInputTextSize,
  DynamoInputTextType,
  DynamoInputTextVariant,
} from './input-text.types';

@Component({
  selector: 'dg-input-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-text.html',
  imports: [DynamoPassThroughDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoInputText),
      multi: true,
    },
  ],
})
export class DynamoInputText
  extends DynamoBaseComponent<DynamoInputTextPart>
  implements ControlValueAccessor
{
  readonly type = input<DynamoInputTextType>('text');
  readonly size = input<DynamoInputTextSize>('md');
  readonly variant = input<DynamoInputTextVariant>('outlined');
  readonly placeholder = input('');
  readonly invalid = input(false);
  /** Accessible name for the input when no visible `<label>` wraps it (e.g. a bare search box). */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the input with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the current value stays visible and the control
   *  stays focusable/tabbable, but the user cannot change it. Unlike `disabled`,
   *  does not remove the control from the tab order or dim its appearance. */
  readonly readOnly = input(false);
  /** Fills the width of its container. Defaults true to match every existing consumer's
   *  assumption of a full-width input; set false for PrimeNG-style intrinsic sizing. */
  readonly fluid = input(true);
  /** Shows a clear button once there's a value, cleared on click. */
  readonly showClear = input(false);
  /** Accessible name for the clear button. */
  readonly clearAriaLabel = input('Clear');

  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model('');

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly wrapperClasses = computed(() =>
    cn(this.showClear() ? 'relative' : 'contents', this.ptFor('root').class),
  );

  protected readonly inputClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('input').class)
      : cn(
          inputTextStyles({
            size: this.size(),
            invalid: this.invalid(),
            variant: this.variant(),
            fluid: this.fluid(),
          }),
          this.showClear() && 'pr-8',
          this.styleClass(),
          this.ptFor('input').class,
        ),
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

  protected clearValue(): void {
    this.value.set('');
    this.onChangeFn('');
    this.inputEl()?.nativeElement.focus();
  }
}
