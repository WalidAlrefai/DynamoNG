import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoTimeline } from './timeline';
import {
  timelineConnectorStyles,
  timelineContentStyles,
  timelineDotStyles,
  timelineItemHostAlternateStyles,
  timelineItemHostStyles,
  timelineMarkerColumnStyles,
} from './timeline.styles';
import type { DynamoTimelineItemPart } from './timeline.types';

@Component({
  selector: 'dg-timeline-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-item.html',
  // `group` + `role="listitem"` (and the align-driven row direction) must
  // land on this component's own host element (the thing that's actually
  // positioned as a sibling under DynamoTimeline's container) — a template
  // can only style descendants of its own root, never its own host, so this
  // can't be done via a normal `[class]` binding inside timeline-item.html.
  host: {
    '[class]': 'hostClasses()',
    role: 'listitem',
  },
})
export class DynamoTimelineItem extends DynamoBaseComponent<DynamoTimelineItemPart> {
  readonly severity = input<DynamoSeverity>('primary');

  // Optional: a standalone `<dg-timeline-item>` outside a `<dg-timeline>`
  // still renders (falls back to 'left'), the same defensive-optional-DI
  // posture other components in this codebase use for ancestor lookups.
  private readonly timeline = inject(DynamoTimeline, { optional: true });

  // This item's own position among its `DynamoTimeline` siblings — `indexOf`
  // compares by reference against the signal-query result, which is exactly
  // the actual component instances. Only meaningful (and only read) when
  // `isAlternate()` is true.
  protected readonly index = computed(() => {
    const list = this.timeline?.items() ?? [];
    return list.indexOf(this);
  });
  protected readonly isAlternate = computed(
    () => this.timeline?.align() === 'alternate',
  );
  // Even index (0, 2, 4...) -> left; odd -> right. No per-item override —
  // keeps this a single-signal addition, same framing as `align` itself.
  protected readonly isRightSide = computed(
    () => this.isAlternate() && this.index() % 2 === 1,
  );
  protected readonly contentGridColumn = computed(() =>
    this.isAlternate() ? (this.isRightSide() ? '3' : '1') : null,
  );
  protected readonly markerGridColumn = computed(() =>
    this.isAlternate() ? '2' : null,
  );

  // Structural (row direction/grid columns), not decorative — stays applied
  // even when `unstyled`, same precedent as `group` itself in
  // timelineItemHostStyles.
  protected readonly hostClasses = computed(() =>
    this.isAlternate()
      ? timelineItemHostAlternateStyles
      : cn(
          timelineItemHostStyles,
          this.timeline?.align() === 'right' ? 'flex-row-reverse' : '',
        ),
  );

  protected readonly markerColumnClasses = timelineMarkerColumnStyles;
  protected readonly dotClasses = computed(() =>
    timelineDotStyles({ severity: this.severity() }),
  );
  protected readonly connectorClasses = timelineConnectorStyles;
  protected readonly contentClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(timelineContentStyles, this.styleClass()),
  );
}
