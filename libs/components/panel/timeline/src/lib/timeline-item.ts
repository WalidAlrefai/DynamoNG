import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
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
  imports: [DynamoPassThroughDirective],
  templateUrl: './timeline-item.html',
  // `group` + `role="listitem"` (and the align/orientation-driven layout)
  // must land on this component's own host element (the thing that's
  // actually positioned as a sibling under DynamoTimeline's container) — a
  // template can only style descendants of its own root, never its own
  // host, so this can't be done via a normal `[class]` binding inside
  // timeline-item.html. `pt`'s `root` part therefore only ever merges a
  // class here — there's no element to attach a `[dgPt]` directive
  // instance to without the heavier `hostDirectives` API, the same
  // documented limitation Org Chart's own host-only `connector` part has.
  host: {
    '[class]': 'hostClasses()',
    role: 'listitem',
  },
})
export class DynamoTimelineItem extends DynamoBaseComponent<DynamoTimelineItemPart> {
  readonly severity = input<DynamoSeverity>('primary');

  // Optional: a standalone `<dg-timeline-item>` outside a `<dg-timeline>`
  // still renders (falls back to 'left'/'vertical'), the same
  // defensive-optional-DI posture other components in this codebase use
  // for ancestor lookups.
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
  protected readonly isHorizontal = computed(
    () => this.timeline?.orientation() === 'horizontal',
  );
  // 'right'/'bottom' are the same reversed state under either orientation's
  // spelling — see timeline.ts's own doc comment.
  protected readonly isReversed = computed(() => {
    const align = this.timeline?.align();
    return align === 'right' || align === 'bottom';
  });
  // Even index (0, 2, 4...) -> the "first" perpendicular side (left/top);
  // odd -> the "second" (right/bottom). No per-item override — keeps this a
  // single-signal addition, same framing as `align` itself. Orientation-
  // neutral name since "right" only means something for a vertical layout.
  protected readonly isSecondaryAlternateSide = computed(
    () => this.isAlternate() && this.index() % 2 === 1,
  );
  protected readonly contentGridColumn = computed(() =>
    this.isAlternate() && !this.isHorizontal()
      ? this.isSecondaryAlternateSide()
        ? '3'
        : '1'
      : null,
  );
  protected readonly markerGridColumn = computed(() =>
    this.isAlternate() && !this.isHorizontal() ? '2' : null,
  );
  protected readonly contentGridRow = computed(() =>
    this.isAlternate() && this.isHorizontal()
      ? this.isSecondaryAlternateSide()
        ? '3'
        : '1'
      : null,
  );
  protected readonly markerGridRow = computed(() =>
    this.isAlternate() && this.isHorizontal() ? '2' : null,
  );

  // Structural (row/column direction, grid placement), not decorative —
  // stays applied even when `unstyled`, same precedent as `group` itself in
  // timelineItemHostStyles.
  protected readonly hostClasses = computed(() => {
    const orientation = this.isHorizontal() ? 'horizontal' : 'vertical';
    return cn(
      this.isAlternate()
        ? timelineItemHostAlternateStyles(orientation)
        : timelineItemHostStyles(orientation, this.isReversed()),
      this.ptFor('root').class,
    );
  });

  protected readonly markerColumnClasses = computed(() =>
    cn(
      timelineMarkerColumnStyles(
        this.isHorizontal() ? 'horizontal' : 'vertical',
      ),
      this.ptFor('marker').class,
    ),
  );
  protected readonly dotClasses = computed(() =>
    timelineDotStyles({
      severity: this.severity(),
      orientation: this.isHorizontal() ? 'horizontal' : 'vertical',
    }),
  );
  protected readonly connectorClasses = computed(() =>
    cn(
      timelineConnectorStyles(this.isHorizontal() ? 'horizontal' : 'vertical'),
      this.ptFor('connector').class,
    ),
  );
  protected readonly contentClasses = computed(() => {
    const base = timelineContentStyles(
      this.isHorizontal() ? 'horizontal' : 'vertical',
    );
    return this.unstyled()
      ? cn(this.styleClass(), this.ptFor('content').class)
      : cn(base, this.styleClass(), this.ptFor('content').class);
  });
}
