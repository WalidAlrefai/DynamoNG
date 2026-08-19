import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  alertCardStyles,
  alertCloseButtonStyles,
  alertIconStyles,
  alertMessageStyles,
  alertTitleStyles,
} from './alert.styles';
import type { DynamoAlertPart } from './alert.types';

@Component({
  selector: 'dg-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert.html',
})
export class DynamoAlert extends DynamoBaseComponent<DynamoAlertPart> {
  readonly severity = input<DynamoSeverity>('info');
  readonly title = input<string | undefined>(undefined);
  readonly closable = input(false);
  /** Two-way bindable: `<dg-alert [(visible)]="showAlert">`. Self-dismisses when closable. */
  readonly visible = model(true);

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(alertCardStyles({ severity: this.severity() }), this.styleClass()),
  );
  protected readonly iconClasses = computed(() =>
    alertIconStyles({ severity: this.severity() }),
  );
  protected readonly titleClasses = alertTitleStyles;
  protected readonly messageClasses = alertMessageStyles;
  protected readonly closeButtonClasses = alertCloseButtonStyles;

  protected close(): void {
    this.visible.set(false);
  }
}
