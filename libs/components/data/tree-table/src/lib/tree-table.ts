import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoSpinner } from '@dynamong/spinner';
import { cn } from '@dynamong/utils/class-merge';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
} from '@dynamong/utils/typeahead';
import {
  collectCascadeIds,
  computeNodeCheckState,
  shouldCascadeCheck,
  type DynamoTreeTableCheckState,
} from './tree-table-selection';
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
  treeTableLoadingWrapperStyles,
  treeTableRootStyles,
  treeTableRowStyles,
  treeTableSelectionCellStyles,
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
  if (typeof a === 'boolean' && typeof b === 'boolean')
    return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
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
 * filtering/pagination aren't in TreeTable's v1 scope (see README), so
 * there's nothing to compose from Table for those. Table's own sort/filter
 * helpers (`table.sort.ts`/`table.filter.ts`) aren't exported from its
 * `index.ts` regardless, so a small comparator is independently duplicated
 * here too, adapted to sort each tree level's siblings independently rather
 * than Table's flat global sort (which would destroy the hierarchy).
 * Row selection (opt-in `selectable`/`selected`/`itemSelect`) mirrors
 * Tree's own cascading-checkbox model instead of Table's flat one — the
 * natural fit for hierarchical data — with the cascade algorithm
 * independently duplicated from `tree-selection.ts` in `tree-table-
 * selection.ts` for the same reason as the sort logic: TreeTable and Tree
 * are both `tier:1`, and same-tier dependencies are forbidden. TreeTable
 * is `tier:1`, not `tier:0`, because it composes `@dynamong/spinner`
 * (`tier:0`) for its `loading` empty-state and `@dynamong/checkbox`
 * (`tier:0`) for row selection.
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
  imports: [NgTemplateOutlet, DynamoSpinner, DynamoCheckbox],
  templateUrl: './tree-table.html',
})
export class DynamoTreeTable<
  TRow = unknown,
> extends DynamoBaseComponent<DynamoTreeTablePart> {
  readonly items = input.required<DynamoTreeTableNode<TRow>[]>();
  readonly columns = input.required<DynamoTreeTableColumn<TRow>[]>();
  /** Two-way bindable: which node ids are currently expanded. */
  readonly expandedIds = model<string[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly emptyMessage = input('No data');
  /** Renders a spinner + message in the empty-state slot and makes sorting,
   *  expand/collapse, and row navigation non-interactive. Never emits back
   *  — the consumer drives it. */
  readonly loading = input(false);
  /** Shown in the empty-state slot instead of `emptyMessage` while `loading` is true. */
  readonly loadingMessage = input('Loading…');
  /** Opt-in row selection. Unset/false renders no selection column. */
  readonly selectable = input(false);
  /**
   * Two-way bindable: every node id (leaf or branch) currently fully
   * checked — same id-keyed shape as `expandedIds`. Checking a branch
   * cascades to its enabled descendants, mirroring `@dynamong/tree`'s own
   * selection model.
   */
  readonly selected = model<string[]>([]);
  /** Fires once per node a user directly checks/unchecks with the full node object — not from `toggleSelectAll()`, and not once per cascaded descendant. */
  readonly itemSelect = output<DynamoTreeTableNode<TRow>>();

  private readonly activeIdSignal = signal<string | undefined>(undefined);
  // Matches visibleEntries()'s order 1:1 — both derive from the same
  // `@for` iteration in tree-table.html, so index-based lookup (rather
  // than an id-keyed Map, which Tree needs because DynamoTreeItem is a
  // separate recursive component) is enough here.
  private readonly rowRefs = viewChildren<ElementRef<HTMLElement>>('rowEl');
  private readonly typeahead = createTypeaheadBuffer();

  /** Sole source of truth for the active sort — mirrors Table's own single-signal `sortState`, not two-way bindable. */
  protected readonly sortState = signal<{
    field: string;
    direction: DynamoTreeTableSortDirection;
  } | null>(null);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(treeTableRootStyles, this.styleClass()),
  );

  /** Plain alias, not a `disabled`-merge — TreeTable has no `disabled` input of its own to merge with. */
  protected readonly isBusy = computed(() => this.loading());

  private readonly selectedSet = computed(() => new Set(this.selected()));

  /**
   * Aggregate checked state across every root node in `items()` — drives
   * the header "select all" checkbox. Scoped to the entire tree, not just
   * visible/expanded entries, since TreeTable has no pagination to scope
   * by the way Table's own select-all is scoped to the current page.
   */
  protected readonly allCheckState = computed<DynamoTreeTableCheckState>(() => {
    const roots = this.items();
    if (roots.length === 0) return 'unchecked';
    const selectedIds = this.selectedSet();
    const states = roots.map((node) =>
      computeNodeCheckState(node, selectedIds),
    );
    if (states.every((state) => state === 'checked')) return 'checked';
    if (states.every((state) => state === 'unchecked')) return 'unchecked';
    return 'indeterminate';
  });

  // Depth-first, sorting each level's own siblings before descending —
  // skipping children of collapsed nodes. A pure data walk, not a DOM
  // query, mirroring Tree's own visibleEntries exactly (id-keyed).
  protected readonly visibleEntries = computed<DynamoTreeTableEntry<TRow>[]>(
    () => {
      const result: DynamoTreeTableEntry<TRow>[] = [];
      const expanded = new Set(this.expandedIds());
      const state = this.sortState();
      const column = state
        ? this.columns().find((c) => c.field === state.field)
        : undefined;
      const direction = state?.direction ?? null;

      const walk = (
        nodes: DynamoTreeTableNode<TRow>[],
        depth: number,
        parentId: string | undefined,
      ) => {
        for (const node of sortNodes(nodes, column, direction)) {
          result.push({ node, depth, parentId });
          if (node.children?.length && expanded.has(node.id)) {
            walk(node.children, depth + 1, node.id);
          }
        }
      };
      walk(this.items(), 0, undefined);
      return result;
    },
  );

  // The roving tab stop: an explicitly-set id if it's still visible and
  // enabled, otherwise the first enabled visible entry — same shape as
  // Tree's own activeEntryId.
  protected readonly activeEntryId = computed(() => {
    const entries = this.visibleEntries();
    if (entries.length === 0) return undefined;
    const explicit = this.activeIdSignal();
    if (
      explicit !== undefined &&
      entries.some(
        (entry) => entry.node.id === explicit && !entry.node.disabled,
      )
    ) {
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
  protected readonly chevronPlaceholderClasses =
    treeTableChevronPlaceholderStyles;
  protected readonly firstCellContentClasses = treeTableFirstCellContentStyles;
  protected readonly loadingWrapperClasses = treeTableLoadingWrapperStyles;
  protected readonly selectionCellClasses = treeTableSelectionCellStyles;

  protected hasChildren(node: DynamoTreeTableNode<TRow>): boolean {
    return (node.children?.length ?? 0) > 0;
  }

  protected isExpanded(id: string): boolean {
    return this.expandedIds().includes(id);
  }

  protected checkState(
    node: DynamoTreeTableNode<TRow>,
  ): DynamoTreeTableCheckState {
    return computeNodeCheckState(node, this.selectedSet());
  }

  protected isActive(entry: DynamoTreeTableEntry<TRow>): boolean {
    return this.activeEntryId() === entry.node.id;
  }

  protected rowClasses(entry: DynamoTreeTableEntry<TRow>) {
    return treeTableRowStyles({
      active: this.isActive(entry),
      disabled: entry.node.disabled ?? false,
    });
  }

  protected chevronClasses(node: DynamoTreeTableNode<TRow>) {
    return treeTableChevronStyles({ expanded: this.isExpanded(node.id) });
  }

  protected indentRem(depth: number): number {
    return treeTableIndentRem(depth);
  }

  protected sortDirectionFor(
    field: string,
  ): DynamoTreeTableSortDirection | 'none' {
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
    return column.cell
      ? column.cell(row)
      : (row as Record<string, unknown>)[column.field];
  }

  protected cellContext(
    node: DynamoTreeTableNode<TRow>,
    depth: number,
  ): DynamoTreeTableCellContext<TRow> {
    return { $implicit: node.data, row: node.data, node, depth };
  }

  /**
   * Click cycle: unsorted -> ascending -> descending -> unsorted. Clicking
   * a *different* sortable column always jumps straight to ascending —
   * single-column sort only, mirrors Table's own toggleSort exactly (minus
   * the page-reset, since TreeTable has no pagination in v1).
   */
  protected toggleSort(column: DynamoTreeTableColumn<TRow>): void {
    if (this.isBusy() || !column.sortable) return;
    this.sortState.update((state) => {
      if (state?.field !== column.field)
        return { field: column.field, direction: 'asc' };
      if (state.direction === 'asc')
        return { field: column.field, direction: 'desc' };
      return null;
    });
  }

  protected toggleExpanded(id: string): void {
    if (this.isBusy()) return;
    const current = this.expandedIds();
    this.expandedIds.set(
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id],
    );
  }

  /** Checks/unchecks `node`'s subtree (cascading to its enabled descendants) and fires `itemSelect` once for `node` itself — never once per cascaded descendant. */
  protected toggleChecked(node: DynamoTreeTableNode<TRow>): void {
    if (this.isBusy() || node.disabled) return;
    const willCheck = shouldCascadeCheck(node, this.selectedSet());
    const ids = collectCascadeIds(node);
    const current = new Set(this.selected());
    for (const id of ids) {
      if (willCheck) {
        current.add(id);
      } else {
        current.delete(id);
      }
    }
    this.selected.set([...current]);
    this.itemSelect.emit(node);
  }

  /**
   * Checks/unchecks every node in the entire tree — not just visible ones
   * — a bulk operation, so (mirroring Table's own `toggleSelectAll` and
   * Tree's cascade convention) it does NOT fire `itemSelect`.
   *
   * Deliberately decides check-vs-uncheck via `shouldCascadeCheck` (same
   * per-root test `toggleChecked` uses), NOT `allCheckState()`: a root with
   * any disabled-and-unchecked descendant can never read as fully
   * `'checked'` (see `computeNodeCheckState`), which would make this
   * comparison always decide to check, with no way to ever cascade-uncheck
   * everything. `shouldCascadeCheck` correctly ignores disabled descendants
   * when deciding.
   */
  protected toggleSelectAll(): void {
    if (this.isBusy()) return;
    const roots = this.items();
    const selectedIds = this.selectedSet();
    const shouldCheck = roots.some((node) =>
      shouldCascadeCheck(node, selectedIds),
    );
    if (!shouldCheck) {
      this.selected.set([]);
      return;
    }
    this.selected.set(roots.flatMap((node) => collectCascadeIds(node)));
  }

  protected onRowKeydown(
    event: KeyboardEvent,
    entry: DynamoTreeTableEntry<TRow>,
  ): void {
    if (this.isBusy()) return;
    const entries = this.visibleEntries();
    const currentIndex = entries.findIndex(
      (candidate) => candidate.node.id === entry.node.id,
    );
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
          const parentIndex = entries.findIndex(
            (candidate) => candidate.node.id === entry.parentId,
          );
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
        if (this.selectable()) {
          this.toggleChecked(entry.node);
        }
        return;
      default:
        this.handleTypeahead(event, entries, currentIndex);
        return;
    }
  }

  /**
   * TreeTable nodes have no `label` field (unlike Tree's `DynamoTreeNode`)
   * — just arbitrary `data: TRow` with `columns` mapping fields to display
   * values. Matches against the first column's cell value instead, coerced
   * to a string: it's the column that already shows the hierarchy/chevron/
   * indent, so visually it already reads as the row's "name". No new
   * column option needed.
   */
  private handleTypeahead(
    event: KeyboardEvent,
    entries: DynamoTreeTableEntry<TRow>[],
    currentIndex: number,
  ): void {
    const columns = this.columns();
    const firstColumn = columns[0];
    if (
      !firstColumn ||
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    const items = entries.map((entry) => ({
      label: String(this.cellValue(entry.node.data, firstColumn)),
      disabled: entry.node.disabled ?? false,
    }));
    const buffer = this.typeahead.append(event.key);
    const query = resolveTypeaheadQuery(buffer);
    const match = findTypeaheadMatch(items, currentIndex, query);
    if (match === null) return;
    event.preventDefault();
    this.moveActive(match);
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
