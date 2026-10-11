import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import type {
  DynamoPassThrough,
  DynamoPassThroughAttrs,
} from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoOrgChartState } from './org-chart-state';
import {
  orgChartBoxStyles,
  orgChartGroupStyles,
  orgChartItemStyles,
  orgChartTogglerStyles,
} from './org-chart.styles';
import type { DynamoOrgChartNode, DynamoOrgChartPart } from './org-chart.types';

// Recursive: renders `<dg-org-chart-item>` again, one level deeper, for each
// child of an expanded node. Mirrors `DynamoTreeItem` — a genuinely
// recursive DOM structure that can't be flattened into one parent-owned
// template. Not exported from `index.ts`: a purely internal rendering
// primitive driven entirely by its `node` input, never placed by a consumer.
@Component({
  selector: 'dg-org-chart-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DynamoOrgChartItem, DynamoPassThroughDirective],
  templateUrl: './org-chart-item.html',
  host: {
    '[class]': 'itemClasses()',
    '[attr.data-node-id]': 'node().id',
  },
})
export class DynamoOrgChartItem {
  readonly node = input.required<DynamoOrgChartNode>();
  /** Forwarded down from `DynamoOrgChart`'s own `pt()` — this component
   *  doesn't extend `DynamoBaseComponent` (it's an internal recursive
   *  rendering primitive, not itself a `pt`-targetable whole), so it
   *  re-declares the same `pt` input shape purely to pass it along to its
   *  own template bindings and to its recursive child
   *  `<dg-org-chart-item>`. Mirrors `DynamoTreeItem`'s own identical
   *  pattern. */
  readonly pt = input<DynamoPassThrough<DynamoOrgChartPart> | undefined>(
    undefined,
  );

  protected readonly state = inject(DynamoOrgChartState);

  protected ptFor(part: DynamoOrgChartPart): DynamoPassThroughAttrs {
    return this.pt()?.[part] ?? {};
  }

  protected readonly hasChildren = computed(
    () => (this.node().children?.length ?? 0) > 0,
  );
  protected readonly collapsed = computed(() =>
    this.state.isCollapsed(this.node().id),
  );
  protected readonly selected = computed(() =>
    this.state.isSelected(this.node().id),
  );
  protected readonly showToggler = computed(
    () => this.state.collapsible() && this.hasChildren(),
  );
  protected readonly childrenVisible = computed(
    () => this.hasChildren() && !this.collapsed(),
  );
  // Focusable when it has a keyboard action: selection, or Arrow-key
  // expand/collapse of its subtree. A disabled node is never focusable —
  // it can't be selected, and its subtree is still toggled via the
  // separate mouse-only toggler span, never the box itself.
  protected readonly focusable = computed(
    () =>
      !this.node().disabled && (this.state.selectable() || this.showToggler()),
  );

  protected readonly boxClasses = computed(() =>
    cn(
      orgChartBoxStyles({
        selectable: this.state.selectable(),
        selected: this.selected(),
        disabled: this.node().disabled ?? false,
      }),
      this.ptFor('node').class,
    ),
  );
  protected readonly togglerClasses = computed(() =>
    cn(
      orgChartTogglerStyles({ collapsed: this.collapsed() }),
      this.ptFor('toggler').class,
    ),
  );
  // `connector` has no dedicated child element — the before:/after:
  // pseudo-elements that draw the connector lines are applied via this
  // component's own host binding, so only class-merging is practical here
  // (no `[dgPt]` directive instance can attach to a component's own host
  // without the heavier `hostDirectives` API, not warranted for a purely
  // decorative pseudo-element host).
  protected readonly itemClasses = computed(() =>
    cn(orgChartItemStyles, this.ptFor('connector').class),
  );
  protected readonly groupClasses = computed(() =>
    cn(orgChartGroupStyles, this.ptFor('group').class),
  );

  protected onBoxClick(): void {
    if (this.node().disabled) {
      return;
    }
    this.state.select(this.node());
  }

  protected onBoxKeydown(event: KeyboardEvent): void {
    if (this.node().disabled) {
      return;
    }
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this.state.selectable()) {
          event.preventDefault();
          this.state.select(this.node());
        }
        return;
      case 'ArrowRight':
        if (this.showToggler() && this.collapsed()) {
          event.preventDefault();
          this.state.toggle(this.node().id);
        }
        return;
      case 'ArrowLeft':
        if (this.showToggler() && !this.collapsed()) {
          event.preventDefault();
          this.state.toggle(this.node().id);
        }
        return;
      default:
        return;
    }
  }

  protected onToggle(event: Event): void {
    event.stopPropagation();
    this.state.toggle(this.node().id);
  }
}
