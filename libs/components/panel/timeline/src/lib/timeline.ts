import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
} from '@angular/core';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoTimelineItem } from './timeline-item';
import { timelineRootStyles } from './timeline.styles';
import type {
  DynamoTimelineAlign,
  DynamoTimelineOrientation,
  DynamoTimelinePart,
} from './timeline.types';

/**
 * `align`'s `'left'`/`'right'` (vertical) and `'top'`/`'bottom'` (horizontal)
 * spellings are the same two underlying states — `'left'`/`'top'` mean "not
 * reversed," `'right'`/`'bottom'` mean "reversed" — just worded per
 * `orientation` for a template author's own clarity. Nothing enforces using
 * the "matching" word for the current orientation; using the other
 * orientation's word still works identically, since both ultimately read
 * through the same `isReversed` check in `DynamoTimelineItem`.
 */
@Component({
  selector: 'dg-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassThroughDirective],
  templateUrl: './timeline.html',
})
export class DynamoTimeline extends DynamoBaseComponent<DynamoTimelinePart> {
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the `role="list"` root. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Which side of the connector line each item's content renders on.
   * Read directly by `DynamoTimelineItem` (a plain DI lookup of this
   * component, not a separate coordinator service — there's only this one
   * signal to share). */
  readonly align = input<DynamoTimelineAlign>('left');
  /** Lays items out in a row instead of a column — every structural class
   *  rotates 90° accordingly. Read by each `DynamoTimelineItem` the same
   *  way `align` is. */
  readonly orientation = input<DynamoTimelineOrientation>('vertical');
  /** Stretches the root to the full available width. */
  readonly fluid = input(false);

  // Read by each `DynamoTimelineItem` (via the same DI lookup used for
  // `align`) to find its own index among siblings, needed for
  // `align="alternate"` to decide which side of the connector line a
  // given item's content lands on. Public, not protected, for the same
  // reason `align` itself is — a sibling component reads it via DI, not
  // a subclass.
  readonly items = contentChildren(DynamoTimelineItem);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          timelineRootStyles({
            orientation: this.orientation(),
            fluid: this.fluid(),
          }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
}
