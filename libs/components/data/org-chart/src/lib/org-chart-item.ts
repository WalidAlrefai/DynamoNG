import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DynamoOrgChartState } from './org-chart-state';
import {
  orgChartBoxStyles,
  orgChartGroupStyles,
  orgChartItemStyles,
  orgChartTogglerStyles,
} from './org-chart.styles';
import type { DynamoOrgChartNode } from './org-chart.types';

// Recursive: renders `<dg-org-chart-item>` again, one level deeper, for each
// child of an expanded node. Mirrors `DynamoTreeItem` — a genuinely
// recursive DOM structure that can't be flattened into one parent-owned
// template. Not exported from `index.ts`: a purely internal rendering
// primitive driven entirely by its `node` input, never placed by a consumer.
@Component({
  selector: 'dg-org-chart-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DynamoOrgChartItem],
  templateUrl: './org-chart-item.html',
  host: {
    '[class]': 'itemClasses',
    '[attr.data-node-id]': 'node().id',
  },
})
export class DynamoOrgChartItem {
  readonly node = input.required<DynamoOrgChartNode>();

  protected readonly state = inject(DynamoOrgChartState);

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
  // expand/collapse of its subtree.
  protected readonly focusable = computed(
    () => this.state.selectable() || this.showToggler(),
  );

  protected readonly boxClasses = computed(() =>
    orgChartBoxStyles({
      selectable: this.state.selectable(),
      selected: this.selected(),
    }),
  );
  protected readonly togglerClasses = computed(() =>
    orgChartTogglerStyles({ collapsed: this.collapsed() }),
  );
  protected readonly itemClasses = orgChartItemStyles;
  protected readonly groupClasses = orgChartGroupStyles;

  protected onBoxClick(): void {
    this.state.select(this.node());
  }

  protected onBoxKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this.state.selectable()) {
          event.preventDefault();
          this.state.select(this.node());
        }
        return;
      case 'ArrowRight':
        if (this.hasChildren() && this.collapsed()) {
          event.preventDefault();
          this.state.toggle(this.node().id);
        }
        return;
      case 'ArrowLeft':
        if (this.hasChildren() && !this.collapsed()) {
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
