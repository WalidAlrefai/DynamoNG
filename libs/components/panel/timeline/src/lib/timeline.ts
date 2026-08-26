import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { timelineRootStyles } from './timeline.styles';
import type { DynamoTimelinePart } from './timeline.types';

@Component({
  selector: 'dg-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline.html',
})
export class DynamoTimeline extends DynamoBaseComponent<DynamoTimelinePart> {
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(timelineRootStyles, this.styleClass()),
  );
}
