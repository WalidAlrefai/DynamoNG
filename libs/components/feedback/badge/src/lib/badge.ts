import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { badgeStyles } from './badge.styles';
import type { DynamoBadgePart, DynamoBadgeVariant } from './badge.types';

@Component({
  selector: 'dg-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.html',
})
export class DynamoBadge extends DynamoBaseComponent<DynamoBadgePart> {
  readonly severity = input<DynamoSeverity>('primary');
  readonly variant = input<DynamoBadgeVariant>('solid');
  readonly size = input<DynamoSize>('md');

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          badgeStyles({
            severity: this.severity(),
            variant: this.variant(),
            size: this.size(),
          }),
          this.styleClass(),
        ),
  );
}
