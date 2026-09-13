import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoButton } from '@dynamong/button';
import type { DynamoSeverity } from '@dynamong/core/api';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { toggleButtonBorderStyles } from './toggle-button.styles';
import type {
  DynamoToggleButtonPart,
  DynamoToggleButtonSize,
} from './toggle-button.types';

@Component({
  selector: 'dg-toggle-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton],
  templateUrl: './toggle-button.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoToggleButton),
      multi: true,
    },
  ],
})
export class DynamoToggleButton
  extends DynamoBaseComponent<DynamoToggleButtonPart>
  implements ControlValueAccessor
{
  /** Two-way bindable: `<dg-toggle-button [(pressed)]="value">`. Also driven by Angular forms via `writeValue`. */
  readonly pressed = model(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly size = input<DynamoToggleButtonSize>('md');
  /** Severity applied while pressed (solid fill). Unpressed always renders neutral, regardless of this input. */
  readonly severity = input<DynamoSeverity>('primary');
  /** Accessible name — required when there's no visible text content (e.g. an icon-only toggle). */
  readonly ariaLabel = input<string | undefined>(undefined);

  private onChangeFn: (value: boolean) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly innerStyleClass = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(toggleButtonBorderStyles(this.pressed()), this.styleClass()),
  );

  protected togglePressed(): void {
    if (this.disabled()) return;
    this.pressed.update((p) => !p);
    this.onChangeFn(this.pressed());
    this.onTouchedFn();
  }

  writeValue(value: boolean | null): void {
    this.pressed.set(value ?? false);
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
