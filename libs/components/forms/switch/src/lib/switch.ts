import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  switchRootStyles,
  switchThumbStyles,
  switchTrackStyles,
} from './switch.styles';
import type { DynamoSwitchPart, DynamoSwitchSize } from './switch.types';

@Component({
  selector: 'dg-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassThroughDirective],
  templateUrl: './switch.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoSwitch),
      multi: true,
    },
  ],
})
export class DynamoSwitch
  extends DynamoBaseComponent<DynamoSwitchPart>
  implements ControlValueAccessor
{
  /** Two-way bindable: `<dg-switch [(checked)]="value">`. Also driven by Angular forms via `writeValue`. */
  readonly checked = model(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the switch stays visible/focusable, but
   *  toggling is blocked. Unlike `disabled`, doesn't dim it or remove it
   *  from the tab order. */
  readonly readOnly = input(false);
  readonly size = input<DynamoSwitchSize>('md');
  readonly invalid = input(false);
  /** Native `name` attribute, for plain (non-Angular-managed) form submission. */
  readonly name = input<string | undefined>(undefined);
  /** Accessible name for the native switch when no visible label content is projected. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the native switch with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);

  protected readonly inputId = this.idGenerator.next('dg-switch');

  private onChangeFn: (value: boolean) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          switchRootStyles({ disabled: this.disabled() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );

  // The track/thumb are structural (the native input is visually hidden), so
  // they stay styled even when `unstyled` is set — unlike button's purely
  // cosmetic color/variant classes, without this the switch would have no
  // affordance.
  protected readonly trackClasses = computed(() =>
    cn(
      switchTrackStyles({
        size: this.size(),
        checked: this.checked(),
        invalid: this.invalid(),
      }),
      this.ptFor('track').class,
    ),
  );
  protected readonly thumbClasses = computed(() =>
    cn(
      switchThumbStyles({ size: this.size(), checked: this.checked() }),
      this.ptFor('thumb').class,
    ),
  );

  protected readonly labelClasses = computed(() =>
    cn('text-sm', this.ptFor('label').class),
  );

  protected readonly inputClasses = computed(() =>
    cn('peer sr-only', this.ptFor('input').class),
  );

  protected onNativeChange(event: Event): void {
    if (this.readOnly()) {
      (event.target as HTMLInputElement).checked = this.checked();
      return;
    }
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
    this.onChangeFn(target.checked);
  }

  protected onBlur(): void {
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
