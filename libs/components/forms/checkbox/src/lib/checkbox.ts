import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { checkboxBoxStyles, checkboxRootStyles } from './checkbox.styles';
import type { DynamoCheckboxPart, DynamoCheckboxSize } from './checkbox.types';

@Component({
  selector: 'dg-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.html',
})
export class DynamoCheckbox extends DynamoBaseComponent<DynamoCheckboxPart> {
  /** Two-way bindable: `<dg-checkbox [(checked)]="value">`. */
  readonly checked = model(false);
  readonly indeterminate = input(false);
  readonly disabled = input(false);
  readonly size = input<DynamoCheckboxSize>('md');

  protected readonly inputId = this.idGenerator.next('dg-checkbox');

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(checkboxRootStyles({ disabled: this.disabled() }), this.styleClass()),
  );

  // The visual box is structural (the native input is visually hidden), so it
  // stays styled even when `unstyled` is set — unlike button's purely cosmetic
  // color/variant classes, without this the checkbox would have no affordance.
  protected readonly boxClasses = computed(() => checkboxBoxStyles({ size: this.size(), checked: this.checked() }));

  protected onNativeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
  }
}
