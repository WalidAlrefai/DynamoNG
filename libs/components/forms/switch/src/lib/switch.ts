import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
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
})
export class DynamoSwitch extends DynamoBaseComponent<DynamoSwitchPart> {
  /** Two-way bindable: `<dg-switch [(checked)]="value">`. */
  readonly checked = model(false);
  readonly disabled = input(false);
  readonly size = input<DynamoSwitchSize>('md');

  protected readonly inputId = this.idGenerator.next('dg-switch');

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
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
  }
}
