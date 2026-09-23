import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoTimelineItem } from './timeline-item';
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

  // Read by each `DynamoTimelineItem` (via the same DI lookup used for
  // `align`) to find its own index among siblings, needed for
  // `align="alternate"` to decide which side of the connector line a
  // given item's content lands on. Public, not protected, for the same
  // reason `align` itself is — a sibling component reads it via DI, not
  // a subclass.
  readonly items = contentChildren(DynamoTimelineItem);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(timelineRootStyles, this.styleClass()),
  );
}
