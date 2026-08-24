import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { tagStyles } from './tag.styles';
import type { DynamoTagPart, DynamoTagVariant } from './tag.types';

@Component({
  selector: 'dg-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tag.html',
})
export class DynamoTag extends DynamoBaseComponent<DynamoTagPart> {
  readonly severity = input<DynamoSeverity>('primary');
  readonly variant = input<DynamoTagVariant>('solid');
  readonly size = input<DynamoSize>('md');

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          tagStyles({
            severity: this.severity(),
            variant: this.variant(),
            size: this.size(),
          }),
          this.styleClass(),
        ),
  );
}
