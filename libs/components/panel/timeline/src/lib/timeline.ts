import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { timelineRootStyles } from './timeline.styles';
import type { DynamoTimelineAlign, DynamoTimelinePart } from './timeline.types';

@Component({
  selector: 'dg-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline.html',
})
export class DynamoTimeline extends DynamoBaseComponent<DynamoTimelinePart> {
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Which side of the connector line each item's content renders on.
   * Read directly by `DynamoTimelineItem` (a plain DI lookup of this
   * component, not a separate coordinator service — there's only this one
   * signal to share). */
  readonly align = input<DynamoTimelineAlign>('left');

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(timelineRootStyles, this.styleClass()),
  );
}
