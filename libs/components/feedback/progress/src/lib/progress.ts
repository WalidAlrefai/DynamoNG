import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { progressFillStyles, progressTrackStyles } from './progress.styles';
import type { DynamoProgressPart } from './progress.types';

@Component({
  selector: 'dg-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress.html',
})
export class DynamoProgress extends DynamoBaseComponent<DynamoProgressPart> {
  readonly value = input<number>(0);
  readonly severity = input<DynamoSeverity>('primary');
  readonly size = input<DynamoSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);

  /**
   * Single source of truth for both the ARIA attrs and the fill's width —
   * derived once so they can never disagree, even for an out-of-range or
   * NaN-adjacent `value`.
   */
  protected readonly clampedValue = computed(() => {
    const value = this.value();
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, value));
  });

  protected readonly trackClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(progressTrackStyles({ size: this.size() }), this.styleClass()),
  );
  protected readonly fillClasses = computed(() =>
    progressFillStyles({ severity: this.severity() }),
  );
}
