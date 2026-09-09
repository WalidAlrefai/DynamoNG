import { NgTemplateOutlet } from '@angular/common';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, TemplateRef, computed, contentChild, input, viewChild } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { virtualScrollViewportStyles } from './virtual-scroll.styles';
import type { DynamoVirtualScrollItemContext, DynamoVirtualScrollPart } from './virtual-scroll.types';

/**
 * A fixed-size virtual-scrolling viewport, for rendering large lists
 * without mounting every item's DOM at once.
 *
 * Architecture: this codebase's only existing "hand a template to a
 * wrapper" idiom is component-owns-a-captured-`<ng-template>`-and-
 * `NgTemplateOutlet`s-it (Table's `cellTemplate`, every overlay component's
 * `panelTemplate`) — there is no structural-directive precedent anywhere in
 * this codebase (no `createEmbeddedView` usage). So this is a wrapper
 * *component*, not a CDK-`*cdkVirtualFor`-style structural directive
 * exposed to consumers directly: a consumer content-projects one
 * `<ng-template let-item let-i="index">`, and internally this component
 * uses CDK's own `cdk-virtual-scroll-viewport`/`cdkVirtualFor`/
 * `cdkFixedSizeVirtualScroll` directives to do the actual virtualization,
 * outletting each rendered item through the captured template with a
 * `{ $implicit, item, index }` context — the same shape as
 * `DynamoTableCellContext`.
 *
 * Fixed-size strategy only (one `itemSize` for every row) — CDK's
 * experimental variable-size strategy is out of scope. This means a list
 * with non-uniform row heights (e.g. Select's grouped options, where a
 * group-heading row is a different height than an option row) can't be
 * virtualized correctly with this component; consumers with that shape
 * should render the full list unvirtualized instead — a documented v1
 * constraint, not a bug to work around here.
 */
@Component({
  selector: 'dg-virtual-scroll',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf],
  templateUrl: './virtual-scroll.html',
})
export class DynamoVirtualScroll<T> extends DynamoBaseComponent<DynamoVirtualScrollPart> {
  readonly items = input.required<readonly T[]>();
  /** Fixed row height in px — every rendered item, and the viewport's own scroll-position math, assumes this exact height. */
  readonly itemSize = input.required<number>();
  /** The viewport's own height in px — CDK's viewport needs an explicit CSS size to know its own bounds; it does not auto-size to its content or parent. */
  readonly height = input.required<number>();
  /** `@for`-style track escape hatch, mirroring `DynamoTable`'s own `trackBy` input shape. Falls back to item reference identity when omitted. */
  readonly trackBy = input<((item: T, index: number) => unknown) | undefined>(undefined);

  protected readonly itemTemplate = contentChild.required(TemplateRef);
  private readonly viewportRef = viewChild.required(CdkVirtualScrollViewport);

  protected readonly viewportClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(virtualScrollViewportStyles, this.styleClass()),
  );

  protected itemContext(item: T, index: number): DynamoVirtualScrollItemContext<T> {
    return { $implicit: item, item, index };
  }

  protected trackByFn = (index: number, item: T): unknown => {
    const fn = this.trackBy();
    return fn ? fn(item, index) : item;
  };

  /** Scrolls so the item at `index` is in view — load-bearing for any consumer with its own roving-focus/active-item concept (e.g. Select's `aria-activedescendant`): once virtualized, an off-screen "active" item may not be rendered in the DOM at all without this. */
  scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    this.viewportRef().scrollToIndex(index, behavior);
  }

  scrollToOffset(offset: number, behavior: ScrollBehavior = 'auto'): void {
    this.viewportRef().scrollToOffset(offset, behavior);
  }
}
