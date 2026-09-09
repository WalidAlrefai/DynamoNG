import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  treeTableCellStyles,
  treeTableChevronButtonStyles,
  treeTableChevronPlaceholderStyles,
  treeTableChevronStyles,
  treeTableEmptyCellStyles,
  treeTableFirstCellContentStyles,
  treeTableHeaderCellStyles,
  treeTableHeaderRowStyles,
  treeTableIndentRem,
  treeTableRootStyles,
  treeTableRowStyles,
  treeTableSortButtonStyles,
  treeTableSortIconStyles,
  treeTableStyles,
} from './tree-table.styles';
import type {
  DynamoTreeTableCellContext,
  DynamoTreeTableColumn,
  DynamoTreeTableNode,
  DynamoTreeTablePart,
  DynamoTreeTableSortDirection,
} from './tree-table.types';

interface DynamoTreeTableEntry<TRow> {
  node: DynamoTreeTableNode<TRow>;
  depth: number;
  parentId: string | undefined;
}

// Independently duplicated from Table's own table.sort.ts (not exported
// from @dynamong/table's index.ts, so there's nothing to import even if
// composing it were this codebase's convention here — see tree-table.ts's
// class doc comment). Sorting always reads the raw `field`, never
// `column.cell` — same split Table's own sort logic makes.
function compareValues(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

// Sorts one level's siblings only — never flattens across levels. Called
// once per level inside visibleEntries()'s walk, so a parent's position
// among its own siblings and its children's position among themselves are
// each independently re-sorted, preserving the hierarchy.
function sortNodes<TRow>(
  nodes: DynamoTreeTableNode<TRow>[],
  column: DynamoTreeTableColumn<TRow> | undefined,
  direction: DynamoTreeTableSortDirection | null,
): DynamoTreeTableNode<TRow>[] {
  if (!column || !direction) return nodes;
  const field = column.field;
  return [...nodes].sort((a, b) => {
    const va = (a.data as Record<string, unknown>)[field];
    const vb = (b.data as Record<string, unknown>)[field];
    const aNil = va === null || va === undefined;
    const bNil = vb === null || vb === undefined;
    if (aNil && bNil) return 0;
    if (aNil) return 1;
    if (bNil) return -1;
    const cmp = compareValues(va, vb);
    return direction === 'asc' ? cmp : -cmp;
  });
}

// Mirrors Tree's own findEnabledEntryIndex shape (linear scan, wrap, skip
// disabled) — same wrap-and-skip-disabled idiom as Menu/Accordion/Tree.
function findEnabledEntryIndex<TRow>(
  entries: DynamoTreeTableEntry<TRow>[],
  from: number,
  delta: number,
): number | null {
  if (entries.length === 0) return null;
  let index = from;
  for (let step = 0; step < entries.length; step++) {
    index = (index + delta + entries.length) % entries.length;
    if (!entries[index]?.node.disabled) return index;
  }
  return null;
}

/**
 * A hierarchical table — Tree's expand/collapse rows combined with Table's
 * columns — for data where each row also carries metadata (size, date,
 * owner, ...), not just a label.
 *
 * Architecture: unlike Tree/PanelMenu (a node renders itself again, nested
 * inside its own DOM subtree), TreeTable can't use a recursive child
 * component — an HTML `<tr>` cannot contain another `<tr>`; a row's
 * expanded children must render as flat *sibling* `<tr>`s under the same
 * `<tbody>`, not nested inside the parent row's own `<tr>`. So this
 * component computes one flattened `visibleEntries()` (the exact
 * depth-first-skip-collapsed-children walk Tree/PanelMenu already use,
 * id-keyed like Tree, not path-keyed like PanelMenu) and renders it with a
 * single flat `@for` in tree-table.html — no DI-scoped state coordinator,
 * no recursive component. Real-world tree-tables all work this way under
 * the hood, since a `<table>` fundamentally can't nest rows either.
 *
 * Column/cell rendering (`cellValue`/`cellContext`, the
 * `@if (cellTemplate) { NgTemplateOutlet } @else { cellValue }` split) is
 * independently duplicated from `@dynamong/table`'s identical-shape logic —
 * Table is `tier:3` and freely composes lower-tier `@dynamong/*` components
 * for its own optional selection/filter/pagination features, but none of
 * those are in TreeTable's v1 scope (see README), so there's nothing to
 * compose here; this keeps TreeTable at `tier:0`. Table's own sort/filter
 * helpers (`table.sort.ts`/`table.filter.ts`) aren't exported from its
 * `index.ts` regardless, so a small comparator is independently duplicated
 * here too, adapted to sort each tree level's siblings independently
 * rather than Table's flat global sort (which would destroy the hierarchy).
 *
 * ARIA: unlike PanelMenu (which had to reject both `role="tree"` and
 * `role="menu"`), ARIA has a role built for exactly this hybrid —
 * `role="treegrid"` (root), `role="row"` (every `<tr>`, header included),
 * `role="gridcell"` (every `<td>`), with `aria-level`/`aria-expanded` on
 * the row. This follows the common row-navigation-only treegrid variant
 * (matching Tree's own keyboard model) rather than full 2D cell navigation.
 */
@Component({
  selector: 'dg-tree-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './tree-table.html',
})
export class DynamoTreeTable<TRow = unknown> extends DynamoBaseComponent<DynamoTreeTablePart> {
  readonly items = input.required<DynamoTreeTableNode<TRow>[]>();
  readonly columns = input.required<DynamoTreeTableColumn<TRow>[]>();
  /** Two-way bindable: which node ids are currently expanded. */
  readonly expandedIds = model<string[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly emptyMessage = input('No data');

  private readonly activeIdSignal = signal<string | undefined>(undefined);
  // Matches visibleEntries()'s order 1:1 — both derive from the same
  // `@for` iteration in tree-table.html, so index-based lookup (rather
  // than an id-keyed Map, which Tree needs because DynamoTreeItem is a
  // separate recursive component) is enough here.
  private readonly rowRefs = viewChildren<ElementRef<HTMLElement>>('rowEl');

  /** Sole source of truth for the active sort — mirrors Table's own single-signal `sortState`, not two-way bindable. */
  protected readonly sortState = signal<{ field: string; direction: DynamoTreeTableSortDirection } | null>(
    null,
  );

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(treeTableRootStyles, this.styleClass()),
  );

  // Depth-first, sorting each level's own siblings before descending —
  // skipping children of collapsed nodes. A pure data walk, not a DOM
  // query, mirroring Tree's own visibleEntries exactly (id-keyed).
  protected readonly visibleEntries = computed<DynamoTreeTableEntry<TRow>[]>(() => {
    const result: DynamoTreeTableEntry<TRow>[] = [];
    const expanded = new Set(this.expandedIds());
    const state = this.sortState();
    const column = state ? this.columns().find((c) => c.field === state.field) : undefined;
    const direction = state?.direction ?? null;

    const walk = (nodes: DynamoTreeTableNode<TRow>[], depth: number, parentId: string | undefined) => {
      for (const node of sortNodes(nodes, column, direction)) {
        result.push({ node, depth, parentId });
        if (node.children?.length && expanded.has(node.id)) {
          walk(node.children, depth + 1, node.id);
        }
      }
    };
    walk(this.items(), 0, undefined);
    return result;
  });

  // The roving tab stop: an explicitly-set id if it's still visible and
  // enabled, otherwise the first enabled visible entry — same shape as
  // Tree's own activeEntryId.
  protected readonly activeEntryId = computed(() => {
    const entries = this.visibleEntries();
    if (entries.length === 0) return undefined;
    const explicit = this.activeIdSignal();
    if (explicit !== undefined && entries.some((entry) => entry.node.id === explicit && !entry.node.disabled)) {
      return explicit;
    }
    const index = entries.findIndex((entry) => !entry.node.disabled);
    return index === -1 ? undefined : entries[index]?.node.id;
  });

  protected readonly tableClasses = treeTableStyles;
  protected readonly headerRowClasses = treeTableHeaderRowStyles;
  protected readonly headerCellClasses = treeTableHeaderCellStyles;
  protected readonly sortButtonClasses = treeTableSortButtonStyles;
  protected readonly cellClasses = treeTableCellStyles;
  protected readonly emptyCellClasses = treeTableEmptyCellStyles;
  protected readonly chevronButtonClasses = treeTableChevronButtonStyles;
  protected readonly chevronPlaceholderClasses = treeTableChevronPlaceholderStyles;
  protected readonly firstCellContentClasses = treeTableFirstCellContentStyles;

  protected hasChildren(node: DynamoTreeTableNode<TRow>): boolean {
    return (node.children?.length ?? 0) > 0;
  }

  protected isExpanded(id: string): boolean {
    return this.expandedIds().includes(id);
  }

  protected isActive(entry: DynamoTreeTableEntry<TRow>): boolean {
    return this.activeEntryId() === entry.node.id;
  }

  protected rowClasses(entry: DynamoTreeTableEntry<TRow>) {
    return treeTableRowStyles({ active: this.isActive(entry), disabled: entry.node.disabled ?? false });
  }

  protected chevronClasses(node: DynamoTreeTableNode<TRow>) {
    return treeTableChevronStyles({ expanded: this.isExpanded(node.id) });
  }

  protected indentRem(depth: number): number {
    return treeTableIndentRem(depth);
  }

  protected sortDirectionFor(field: string): DynamoTreeTableSortDirection | 'none' {
    const state = this.sortState();
    return state?.field === field ? state.direction : 'none';
  }

  protected ariaSortFor(field: string): 'ascending' | 'descending' | null {
    const state = this.sortState();
    if (state?.field !== field) return null;
    return state.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIconClasses(direction: DynamoTreeTableSortDirection | 'none') {
    return treeTableSortIconStyles({ direction });
  }

  protected cellValue(row: TRow, column: DynamoTreeTableColumn<TRow>): unknown {
    return column.cell ? column.cell(row) : (row as Record<string, unknown>)[column.field];
  }

  protected cellContext(node: DynamoTreeTableNode<TRow>, depth: number): DynamoTreeTableCellContext<TRow> {
    return { $implicit: node.data, row: node.data, node, depth };
  }

  /**
   * Click cycle: unsorted -> ascending -> descending -> unsorted. Clicking
   * a *different* sortable column always jumps straight to ascending —
   * single-column sort only, mirrors Table's own toggleSort exactly (minus
   * the page-reset, since TreeTable has no pagination in v1).
   */
  protected toggleSort(column: DynamoTreeTableColumn<TRow>): void {
    if (!column.sortable) return;
    this.sortState.update((state) => {
      if (state?.field !== column.field) return { field: column.field, direction: 'asc' };
      if (state.direction === 'asc') return { field: column.field, direction: 'desc' };
      return null;
    });
  }

  protected toggleExpanded(id: string): void {
    const current = this.expandedIds();
    this.expandedIds.set(
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    );
  }

  protected onRowKeydown(event: KeyboardEvent, entry: DynamoTreeTableEntry<TRow>): void {
    const entries = this.visibleEntries();
    const currentIndex = entries.findIndex((candidate) => candidate.node.id === entry.node.id);
    if (currentIndex === -1) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(findEnabledEntryIndex(entries, currentIndex, 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(findEnabledEntryIndex(entries, currentIndex, -1));
        return;
      case 'Home':
        event.preventDefault();
        this.moveActive(findEnabledEntryIndex(entries, -1, 1));
        return;
      case 'End':
        event.preventDefault();
        this.moveActive(findEnabledEntryIndex(entries, 0, -1));
        return;
      case 'ArrowRight': {
        event.preventDefault();
        const hasChildren = this.hasChildren(entry.node);
        const isExpanded = this.isExpanded(entry.node.id);
        if (hasChildren && !isExpanded) {
          this.toggleExpanded(entry.node.id);
        } else if (hasChildren && isExpanded) {
          const child = entries[currentIndex + 1];
          if (child?.parentId === entry.node.id) {
            this.moveActive(currentIndex + 1);
          }
        }
        return;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const hasChildren = this.hasChildren(entry.node);
        const isExpanded = this.isExpanded(entry.node.id);
        if (hasChildren && isExpanded) {
          this.toggleExpanded(entry.node.id);
        } else if (entry.parentId !== undefined) {
          const parentIndex = entries.findIndex((candidate) => candidate.node.id === entry.parentId);
          this.moveActive(parentIndex === -1 ? null : parentIndex);
        }
        return;
      }
      case 'Enter':
      case ' ':
        if (entry.node.disabled) return;
        event.preventDefault();
        if (this.hasChildren(entry.node)) {
          this.toggleExpanded(entry.node.id);
        }
        return;
      default:
        return;
    }
  }

  protected onRowFocus(entry: DynamoTreeTableEntry<TRow>): void {
    this.activeIdSignal.set(entry.node.id);
  }

  private moveActive(index: number | null): void {
    if (index === null) return;
    const entry = this.visibleEntries()[index];
    if (!entry) return;
    this.activeIdSignal.set(entry.node.id);
    this.rowRefs()[index]?.nativeElement.focus();
  }
}
