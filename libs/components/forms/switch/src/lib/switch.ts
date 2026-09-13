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
  /** Accessible name for the native switch when no visible label content is projected. */
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly inputId = this.idGenerator.next('dg-switch');

  private onChangeFn: (value: boolean) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(switchRootStyles({ disabled: this.disabled() }), this.styleClass()),
  );

  // The track/thumb are structural (the native input is visually hidden), so
  // they stay styled even when `unstyled` is set — unlike button's purely
  // cosmetic color/variant classes, without this the switch would have no
  // affordance.
  protected readonly trackClasses = computed(() =>
    switchTrackStyles({ size: this.size(), checked: this.checked() }),
  );
  protected readonly thumbClasses = computed(() =>
    switchThumbStyles({ size: this.size(), checked: this.checked() }),
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
