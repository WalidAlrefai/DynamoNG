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

  // Structural (row direction), not decorative — stays applied even when
  // `unstyled`, same precedent as `group` itself in timelineItemHostStyles.
  protected readonly hostClasses = computed(() =>
    cn(
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
