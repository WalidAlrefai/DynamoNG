import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoOrgChartItem } from './org-chart-item';
import { DynamoOrgChartState } from './org-chart-state';
import { orgChartRootStyles, orgChartTreeStyles } from './org-chart.styles';
import type {
  DynamoOrgChartNode,
  DynamoOrgChartNodeContext,
  DynamoOrgChartPart,
  DynamoOrgChartSelectionMode,
} from './org-chart.types';

/**
 * A top-down hierarchy diagram: each node is a box, its children sit in a
 * connected row beneath it. Recursion is rendered by the internal
 * `DynamoOrgChartItem`, coordinated through a DI-scoped `DynamoOrgChartState`
 * — the same shape as `@dynamong/tree`, but laid out horizontally with
 * pure-CSS connector lines instead of vertical indentation.
 *
 * Each node's contents come from a single projected
 * `<ng-template let-node>` (the "component owns a captured template +
 * `NgTemplateOutlet`" idiom shared with `DynamoTable` / `DynamoDataView`);
 * with no template projected, the node's `label` is rendered as plain text.
 */
@Component({
  selector: 'dg-org-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOrgChartItem],
  providers: [DynamoOrgChartState],
  templateUrl: './org-chart.html',
})
export class DynamoOrgChart extends DynamoBaseComponent<DynamoOrgChartPart> {
  /** Root nodes — usually one, but a forest is allowed. */
  readonly value = input.required<DynamoOrgChartNode[]>();
  /** Show a collapse/expand toggle on every node that has children. */
  readonly collapsible = input(true);
  /**
   * Two-way bindable: the ids of currently-collapsed subtrees. Empty (the
   * default) means the whole chart is expanded.
   */
  readonly collapsedIds = model<string[]>([]);
  readonly selectable = input(false);
  readonly selectionMode = input<DynamoOrgChartSelectionMode>('single');
  /** Two-way bindable: the ids of selected nodes. */
  readonly selection = model<string[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Fires on every node-box click, whether or not `selectable` is set. */
  readonly nodeSelect = output<DynamoOrgChartNode>();

  protected readonly nodeTemplate = contentChild<
    TemplateRef<DynamoOrgChartNodeContext>
  >(TemplateRef);

  private readonly state = inject(DynamoOrgChartState);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(orgChartRootStyles, this.styleClass()),
  );
  protected readonly treeClasses = orgChartTreeStyles;

  private readonly collapsedSet = computed(() => new Set(this.collapsedIds()));
  private readonly selectedSet = computed(() => new Set(this.selection()));

  constructor() {
    super();

    this.state.template = () => this.nodeTemplate() ?? null;
    this.state.collapsible = () => this.collapsible();
    this.state.selectable = () => this.selectable();
    this.state.isCollapsed = (id) => this.collapsedSet().has(id);
    this.state.isSelected = (id) => this.selectedSet().has(id);
    this.state.toggle = (id) => this.toggleCollapsed(id);
    this.state.select = (node) => this.selectNode(node);
  }

  private toggleCollapsed(id: string): void {
    const current = this.collapsedIds();
    this.collapsedIds.set(
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id],
    );
  }

  private selectNode(node: DynamoOrgChartNode): void {
    this.nodeSelect.emit(node);
    if (!this.selectable()) {
      return;
    }
    const current = this.selection();
    const alreadySelected = current.includes(node.id);
    if (this.selectionMode() === 'single') {
      this.selection.set(alreadySelected ? [] : [node.id]);
    } else {
      this.selection.set(
        alreadySelected
          ? current.filter((existing) => existing !== node.id)
          : [...current, node.id],
      );
    }
  }
}
