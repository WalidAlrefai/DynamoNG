import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoCheckIcon } from '@dynamong/icons';
import {
  checkboxBoxStyles,
  checkboxIndeterminateDashStyles,
  checkboxRootStyles,
} from './checkbox.styles';
import type {
  DynamoCheckboxPart,
  DynamoCheckboxSize,
  DynamoCheckboxVariant,
} from './checkbox.types';

@Component({
  selector: 'dg-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCheckIcon, DynamoPassThroughDirective],
  templateUrl: './checkbox.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoCheckbox),
      multi: true,
    },
  ],
})
export class DynamoCheckbox
  extends DynamoBaseComponent<DynamoCheckboxPart>
  implements ControlValueAccessor
{
  /** Two-way bindable: `<dg-checkbox [(checked)]="value">`. Also driven by Angular forms via `writeValue`. */
  readonly checked = model(false);
  readonly indeterminate = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the current state stays visible and the input stays focusable/tabbable, but toggling is blocked. Unlike `disabled`, does not remove the control from the tab order or dim its appearance. */
  readonly readOnly = input(false);
  readonly size = input<DynamoCheckboxSize>('md');
  readonly variant = input<DynamoCheckboxVariant>('outlined');
  readonly invalid = input(false);
  /** Native `name` attribute, for plain (non-Angular-managed) form submission. */
  readonly name = input<string | undefined>(undefined);
  /** Accessible name for the native checkbox when no visible label content is projected. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Accessible name via reference to an external label element, mirroring `ariaLabel`'s forwarding. */
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  /** Associates the native checkbox with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);

  private onChangeFn: (value: boolean) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly inputId = this.idGenerator.next('dg-checkbox');

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          checkboxRootStyles({ disabled: this.disabled() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );

  // The visual box is structural (the native input is visually hidden), so it
  // stays styled even when `unstyled` is set — unlike button's purely cosmetic
  // color/variant classes, without this the checkbox would have no affordance.
  protected readonly boxClasses = computed(() =>
    cn(
      checkboxBoxStyles({
        size: this.size(),
        checked: this.checked(),
        variant: this.variant(),
        invalid: this.invalid(),
      }),
      this.ptFor('box').class,
    ),
  );

  protected readonly indeterminateDashClasses = computed(() =>
    checkboxIndeterminateDashStyles({ size: this.size() }),
  );

  protected readonly labelClasses = computed(() =>
    cn('text-sm', this.ptFor('label').class),
  );

  protected readonly inputClasses = computed(() =>
    cn('peer sr-only', this.ptFor('input').class),
  );

  protected onNativeChange(event: Event): void {
    if (this.readOnly()) {
      // The native checkbox already flipped its own DOM state on click —
      // revert it so the visual box (driven by `checked()`) stays the
      // source of truth instead of drifting from the model.
      (event.target as HTMLInputElement).checked = this.checked();
      return;
    }
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
    this.onChangeFn(target.checked);
    this.onTouchedFn();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
