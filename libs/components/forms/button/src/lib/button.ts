import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { buttonStyles } from './button.styles';
import type {
  DynamoButtonPart,
  DynamoButtonSeverity,
  DynamoButtonSize,
  DynamoButtonType,
  DynamoButtonVariant,
} from './button.types';

@Component({
  selector: 'dg-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
})
export class DynamoButton extends DynamoBaseComponent<DynamoButtonPart> {
  readonly severity = input<DynamoButtonSeverity>('primary');
  readonly size = input<DynamoButtonSize>('md');
  readonly variant = input<DynamoButtonVariant>('solid');
  readonly type = input<DynamoButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          buttonStyles({ severity: this.severity(), size: this.size(), variant: this.variant() }),
          this.styleClass(),
        ),
  );
}
