import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnInit,
  computed,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoPagination } from '@dynamong/pagination';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
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
import { filterTree } from './tree-table.filter';
import {
  treeTableCellStyles,
  treeTableChevronButtonStyles,
  treeTableChevronPlaceholderStyles,
  treeTableChevronStyles,
  treeTableColumnFilterCellStyles,
  treeTableColumnFilterRowStyles,
  treeTableEmptyCellStyles,
  treeTableFilterWrapperStyles,
  treeTableFirstCellContentStyles,
  treeTableHeaderCellStyles,
  treeTableHeaderRowStyles,
  treeTableIndentRem,
  treeTableLoadingWrapperStyles,
  treeTablePaginationWrapperStyles,
  treeTableRootStyles,
  treeTableRowStyles,
  treeTableSelectionCellStyles,
  treeTableSortButtonStyles,
  treeTableSortIconStyles,
  treeTableStyles,
  treeTableVirtualBodyRowStyles,
  treeTableVirtualHeaderRowStyles,
  treeTableVirtualStyles,
} from './tree-table.styles';
import type {
  DynamoTreeTableCellContext,
  DynamoTreeTableColumn,
  DynamoTreeTableColumnFilterContext,
  DynamoTreeTableLazyLoadEvent,
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
  nodes: readonly DynamoTreeTableNode<TRow>[],
  column: DynamoTreeTableColumn<TRow> | undefined,
  direction: DynamoTreeTableSortDirection | null,
): DynamoTreeTableNode<TRow>[] {
  if (!column || !direction) return [...nodes];
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
 * independently duplicated from `@dynamong/table`'s identical-shape logic.
 * Table's own sort/filter helpers (`table.sort.ts`/`table.filter.ts`)
 * aren't exported from its `index.ts` regardless, so a small comparator
 * is independently duplicated here too, adapted to sort each tree level's
 * siblings independently rather than Table's flat global sort (which
 * would destroy the hierarchy) — likewise `tree-table.filter.ts`'s
 * `filterTree` is independently duplicated (and hierarchy-aware) rather
 * than reusing Table's flat `filterRows`.
 * Row selection (opt-in `selectable`/`selected`/`itemSelect`) mirrors
 * Tree's own cascading-checkbox model instead of Table's flat one — the
 * natural fit for hierarchical data — with the cascade algorithm
 * independently duplicated from `tree-selection.ts` in `tree-table-
 * selection.ts` for the same reason as the sort logic: TreeTable and Tree
 * are both `tier:1`, and same-tier dependencies are forbidden.
 *
 * Global filter (`filterable`/`filterText`) and pagination
 * (`pageSize`/`page`) were added in v2. Filtering is hierarchy-aware — see
 * `tree-table.filter.ts`'s `filterTree` doc for why a flat per-node filter
 * would hide a matching descendant behind its now-excluded parent, and why
 * a match keeps its whole subtree unpruned. Pagination paginates over
 * ROOT nodes only (`pagedRoots`), never the flattened `visibleEntries()`
 * list — paginating the flattened list would make the page boundary shift
 * every time a row expands/collapses, since a single root's visible
 * descendant count is unbounded and variable. `selectable`'s "select all"
 * is scoped to the current page's roots once pagination is in play, same
 * as Table's own page-scoped `toggleSelectAll`. TreeTable moved from
 * `tier:1` to `tier:3` to compose `@dynamong/input-text` (`tier:0`) for the
 * filter box and `@dynamong/pagination` (`tier:2`) for the footer, on top
 * of the `tier:0` `@dynamong/spinner`/`@dynamong/checkbox` it already used.
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
  imports: [
    NgTemplateOutlet,
    DynamoSpinner,
    DynamoCheckbox,
    DynamoInputText,
    DynamoPagination,
    DynamoVirtualScroll,
    DynamoPassThroughDirective,
  ],
  templateUrl: './tree-table.html',
})
export class DynamoTreeTable<TRow = unknown>
  extends DynamoBaseComponent<DynamoTreeTablePart>
  implements OnInit
{
  readonly items = input.required<DynamoTreeTableNode<TRow>[]>();
  readonly columns = input.required<DynamoTreeTableColumn<TRow>[]>();
  /** Two-way bindable: which node ids are currently expanded. */
  readonly expandedIds = model<string[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Controls the root wrapper's width — `true` (default) is `w-full`; `false` shrinks to content. */
  readonly fluid = input(true);
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

  /**
   * Opt-in global filter. `false` (default) renders no search UI at all —
   * byte-for-byte identical to v1. Mirrors Table's own `filterable`.
   */
  readonly filterable = input(false);
  /** Placeholder text for the search input rendered when `filterable` is `true`. */
  readonly filterPlaceholder = input('Search...');
  /**
   * Two-way bindable filter query — mirrors Table's own `filterText`.
   * Case-insensitive substring match against every `filterable !== false`
   * column; blank/whitespace-only text matches every node. Typing into
   * the search input writes here AND resets `page` to 1 in the same
   * handler (`onFilterTextChange`) — no `effect()` needed.
   */
  readonly filterText = model('');
  /** Shown in the `@empty` block instead of `emptyMessage` when `items` has nodes but the active `filterText` matched none of them. */
  readonly noMatchesMessage = input('No matching rows');

  /**
   * Two-way bindable per-column filter values, keyed by `column.field` —
   * mirrors Table's own `columnFilters`. Composes with `filterText` as a
   * logical AND, in a single hierarchy-aware pass — see `filterTree`'s own
   * doc comment for why this can't be two sequential filter passes.
   */
  readonly columnFilters = model<Record<string, unknown>>({});

  /**
   * Opt-in pagination over ROOT nodes only — see this class's own doc
   * comment for why the flattened visible-row list isn't what gets
   * paginated. Unset (default) means every root renders and no pagination
   * UI shows at all — byte-for-byte identical to v1. Mirrors Table's own
   * `pageSize`.
   */
  readonly pageSize = model<number | undefined>(undefined);
  /** Options for the pagination footer's rows-per-page selector — forwarded as-is. */
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);
  /** Two-way bindable, 1-indexed root-node page — mirrors Table's own `page`. */
  readonly page = model(1);

  /**
   * Opt-in virtual scrolling over `visibleEntries()` (the already flat,
   * expand-state-aware row list) via `@dynamong/virtual-scroll` — mirrors
   * Table's own `virtualScroll`. Two deliberate divergences from Table's
   * own exclusions: `pageSize` composes freely (TreeTable's `pageSize` caps
   * only the ROOT count, not the flattened row count a single expanded root
   * can still produce, unlike Table's `pageSize` which already caps the
   * total render count), and expand/collapse is fully supported (TreeTable's
   * expand/collapse IS the core feature, not an optional add-on row the way
   * Table's `expansionTemplate` is).
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized. */
  readonly virtualScrollItemSize = input(40);
  /** Viewport height in px when virtualized. */
  readonly virtualScrollHeight = input(400);

  /**
   * Opt-in top-level lazy/server-driven mode — mirrors Table's own `lazy`.
   * `filteredItems()`/`pagedRoots()` both bypass to `items()` verbatim
   * while `true` (the consumer is expected to hand back exactly the
   * current page's already-filtered-and-sorted root nodes); `lazyLoad`
   * fires on every page/sort/filter-driven UI interaction instead.
   * Independent of per-node lazy loading (`DynamoTreeTableNode.leaf`) —
   * see that type's own doc comment for how the two compose.
   */
  readonly lazy = input(false);
  /** Total root-node count the server reports — backs `pageCount`/the pagination footer while `lazy`. Falls back to `items().length` (dev-warned) when omitted. */
  readonly totalRecords = input<number | undefined>(undefined);
  readonly lazyLoad = output<DynamoTreeTableLazyLoadEvent>();

  /**
   * Fires when a node whose children aren't loaded yet (`leaf === false`
   * and no `children`) is expanded for the first time — see
   * `DynamoTreeTableNode.leaf`'s own doc comment. Fires every time such a
   * node is expanded, including a re-expand before an earlier fetch has
   * resolved — no internal request de-duplication; a consumer wanting to
   * avoid duplicate fetches memoizes by `node.id` themselves.
   */
  readonly nodeExpand = output<DynamoTreeTableNode<TRow>>();

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly virtualScrollRef = viewChild(DynamoVirtualScroll);
  private readonly activeIdSignal = signal<string | undefined>(undefined);
  private readonly typeahead = createTypeaheadBuffer();

  /** Sole source of truth for the active sort — mirrors Table's own single-signal `sortState`, not two-way bindable. */
  protected readonly sortState = signal<{
    field: string;
    direction: DynamoTreeTableSortDirection;
  } | null>(null);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          treeTableRootStyles({ fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );

  /** Plain alias, not a `disabled`-merge — TreeTable has no `disabled` input of its own to merge with. */
  protected readonly isBusy = computed(() => this.loading());

  private readonly selectedSet = computed(() => new Set(this.selected()));

  /**
   * `items()` pruned to hierarchy-matching branches — see `filterTree`'s
   * own doc comment. Returns `items()` unchanged (same reference) when
   * there is no active `filterText` and no active `columnFilters` entry.
   * Bypasses pruning entirely while `lazy()` — the consumer is expected to
   * hand back exactly the current page's already-filtered root nodes, same
   * as Table's own `filteredData` bypass.
   */
  protected readonly filteredItems = computed(() =>
    this.lazy()
      ? this.items()
      : filterTree(
          this.items(),
          this.columns(),
          this.filterText(),
          this.columnFilters(),
          (row, column) => this.cellValue(row, column),
        ),
  );

  /** Root count driving `pageCount`/the pagination footer — `totalRecords()` (dev-warned fallback to `items().length`) while `lazy`, else `filteredItems().length`. */
  protected readonly totalItemCount = computed(() =>
    this.lazy()
      ? (this.totalRecords() ?? this.items().length)
      : this.filteredItems().length,
  );

  protected readonly hasColumnFilters = computed(() =>
    this.columns().some((column) => !!column.columnFilter),
  );

  /** True while a non-blank global filter or an active column filter is narrowing `filteredItems()` — used by `visibleEntries` to force every retained node open (see its own comment) and by `emptyStateMessage` to pick the right empty-state wording. */
  protected readonly isFilterActive = computed(() => {
    if (this.filterText().trim().length > 0) return true;
    const filters = this.columnFilters();
    return this.columns().some((column) => {
      const value = filters[column.field];
      return value !== undefined && value !== null && value !== '';
    });
  });

  /** Always >= 1, even for zero root nodes — mirrors Table's own `pageCount`. Based on `totalItemCount()` (root count), not the flattened row count — see this class's own doc comment. */
  protected readonly pageCount = computed(() => {
    const size = this.pageSize();
    if (!size) return 1;
    return Math.max(1, Math.ceil(this.totalItemCount() / size));
  });

  /** Clamps the *read* of `page()` into `[1, pageCount()]` without ever writing back to `page` — mirrors Table's own `currentPage`, keeping TreeTable effect-free. */
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(1, this.page()), this.pageCount()),
  );

  /** The current page's root nodes (or every filtered root, when `pageSize` is unset) — what `visibleEntries()` actually walks. Bypasses slicing entirely while `lazy()` — `items()` IS the current page. */
  protected readonly pagedRoots = computed(() => {
    if (this.lazy()) return this.items();
    const size = this.pageSize();
    if (!size) return this.filteredItems();
    const start = (this.currentPage() - 1) * size;
    return this.filteredItems().slice(start, start + size);
  });

  /**
   * Picks which "no rows" message the `@empty` block shows — mirrors
   * Table's own `emptyStateMessage` exactly: `items()` itself empty always
   * wins with `emptyMessage()` regardless of an active-but-irrelevant
   * filter; otherwise an active filter that matched nothing gets
   * `noMatchesMessage()`.
   */
  protected readonly emptyStateMessage = computed(() =>
    this.isFilterActive() && this.items().length > 0
      ? this.noMatchesMessage()
      : this.emptyMessage(),
  );

  /**
   * Aggregate checked state across the current page's root nodes — drives
   * the header "select all" checkbox. Scoped to `pagedRoots()`, not the
   * entire tree, mirroring Table's own page-scoped select-all now that
   * TreeTable has pagination (v1 scoped this to the whole tree since there
   * was no page to scope by).
   */
  protected readonly allCheckState = computed<DynamoTreeTableCheckState>(() => {
    const roots = this.pagedRoots();
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
  // query, mirroring Tree's own visibleEntries exactly (id-keyed). Walks
  // `pagedRoots()` (filtered + paginated), not raw `items()`. While a
  // filter is active, every retained node renders as expanded regardless
  // of `expandedIds` — `filterTree` already pruned the tree down to
  // matches and their ancestor chain, so there is nothing to hide, and
  // this way filtering never has to write to the `expandedIds` model.
  // Excludes `lazy()`: `filteredItems()` never actually prunes anything
  // while lazy (the consumer filters server-side), so there's nothing a
  // force-expand would be revealing — `expandedIds` alone should still
  // govern what's visible, same as the unfiltered case.
  protected readonly visibleEntries = computed<DynamoTreeTableEntry<TRow>[]>(
    () => {
      const result: DynamoTreeTableEntry<TRow>[] = [];
      const expanded = new Set(this.expandedIds());
      const filterActive = this.isFilterActive() && !this.lazy();
      const state = this.sortState();
      const column = state
        ? this.columns().find((c) => c.field === state.field)
        : undefined;
      const direction = state?.direction ?? null;

      const walk = (
        nodes: readonly DynamoTreeTableNode<TRow>[],
        depth: number,
        parentId: string | undefined,
      ) => {
        for (const node of sortNodes(nodes, column, direction)) {
          result.push({ node, depth, parentId });
          if (
            node.children?.length &&
            (filterActive || expanded.has(node.id))
          ) {
            walk(node.children, depth + 1, node.id);
          }
        }
      };
      walk(this.pagedRoots(), 0, undefined);
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

  protected readonly tableClasses = computed(() =>
    cn(treeTableStyles, this.ptFor('table').class),
  );
  protected readonly headerRowClasses = computed(() =>
    cn(treeTableHeaderRowStyles, this.ptFor('headerRow').class),
  );
  protected readonly headerCellClasses = computed(() =>
    cn(treeTableHeaderCellStyles, this.ptFor('headerCell').class),
  );
  protected readonly sortButtonClasses = computed(() =>
    cn(treeTableSortButtonStyles, this.ptFor('sortButton').class),
  );
  protected readonly cellClasses = computed(() =>
    cn(treeTableCellStyles, this.ptFor('cell').class),
  );
  protected readonly emptyCellClasses = treeTableEmptyCellStyles;
  protected readonly chevronButtonClasses = computed(() =>
    cn(treeTableChevronButtonStyles, this.ptFor('chevronButton').class),
  );
  protected readonly chevronPlaceholderClasses =
    treeTableChevronPlaceholderStyles;
  protected readonly firstCellContentClasses = treeTableFirstCellContentStyles;
  protected readonly loadingWrapperClasses = treeTableLoadingWrapperStyles;
  protected readonly selectionCellClasses = computed(() =>
    cn(treeTableSelectionCellStyles, this.ptFor('selectionCell').class),
  );
  protected readonly filterWrapperClasses = computed(() =>
    cn(treeTableFilterWrapperStyles, this.ptFor('filterWrapper').class),
  );
  protected readonly paginationWrapperClasses = computed(() =>
    cn(treeTablePaginationWrapperStyles, this.ptFor('paginationWrapper').class),
  );
  protected readonly columnFilterRowClasses = computed(() =>
    cn(treeTableColumnFilterRowStyles, this.ptFor('columnFilterRow').class),
  );
  protected readonly columnFilterCellClasses = computed(() =>
    cn(treeTableColumnFilterCellStyles, this.ptFor('columnFilterCell').class),
  );
  protected readonly virtualTableClasses = computed(() =>
    cn(treeTableVirtualStyles, this.ptFor('table').class),
  );
  protected readonly virtualHeaderRowClasses = computed(() =>
    cn(treeTableVirtualHeaderRowStyles, this.ptFor('headerRow').class),
  );
  protected readonly virtualBodyRowClasses = computed(() =>
    cn(treeTableVirtualBodyRowStyles, this.ptFor('row').class),
  );

  /**
   * Grid-track list shared by the virtualized header and every body row.
   * Simpler than Table's own equivalent: no separate leading "expand"
   * track is needed — the chevron lives inside the first column's own
   * cell (via indentation), not a dedicated column — only an optional
   * leading selection track.
   */
  protected readonly virtualGridTemplate = computed(() => {
    const tracks = this.columns().map(() => 'minmax(0, 1fr)');
    return this.selectable()
      ? ['2.5rem', ...tracks].join(' ')
      : tracks.join(' ');
  });

  /** `true` for a node with real children, OR a node flagged `leaf === false` (children exist server-side but aren't loaded yet — see `DynamoTreeTableNode.leaf`'s own doc comment). Fully backward compatible: a consumer who never sets `leaf` sees zero behavior change. */
  protected hasChildren(node: DynamoTreeTableNode<TRow>): boolean {
    return (node.children?.length ?? 0) > 0 || node.leaf === false;
  }

  /**
   * Pure derived state, not a stored signal — deliberately effect-free. A
   * node is "loading" exactly when it's expanded, flagged `leaf === false`,
   * and still has no children; as soon as the consumer writes a new
   * `items()` tree with that node's children populated (and/or `leaf`
   * flipped `true`), this flips `false` purely as a side effect of the new
   * input, with no manual bookkeeping to keep in sync.
   */
  protected isNodeLoading(node: DynamoTreeTableNode<TRow>): boolean {
    return (
      this.expandedIds().includes(node.id) &&
      node.leaf === false &&
      !node.children?.length
    );
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
    return cn(
      treeTableRowStyles({
        active: this.isActive(entry),
        disabled: entry.node.disabled ?? false,
      }),
      this.ptFor('row').class,
    );
  }

  protected chevronClasses(node: DynamoTreeTableNode<TRow>) {
    return cn(
      treeTableChevronStyles({ expanded: this.isExpanded(node.id) }),
      this.ptFor('chevron').class,
    );
  }

  protected indentRem(depth: number): number {
    return treeTableIndentRem(depth);
  }

  /**
   * Accessible name for the chevron button — uses the row's own first-column
   * value ("Expand Resume.pdf") rather than a numeric position, since every
   * row already has a natural "name" via its first column (the same value
   * `handleTypeahead` already treats as the row's identity).
   */
  protected chevronLabel(node: DynamoTreeTableNode<TRow>): string {
    const verb = this.isExpanded(node.id) ? 'Collapse ' : 'Expand ';
    const firstColumn = this.columns()[0];
    return (
      verb +
      (firstColumn ? String(this.cellValue(node.data, firstColumn)) : node.id)
    );
  }

  protected sortDirectionFor(
    field: string,
  ): DynamoTreeTableSortDirection | 'none' {
    const state = this.sortState();
    return state?.field === field ? state.direction : 'none';
  }

  /**
   * `'none'`, not `null`, for a sortable-but-currently-unsorted column — WAI-ARIA
   * authoring practice wants an explicit value here so assistive tech can
   * distinguish "sortable, not currently sorted" from "not sortable at all"
   * (the latter correctly gets no `aria-sort` attribute at all, via the
   * template's own `column.sortable ? ariaSortFor(...) : null` ternary).
   */
  protected ariaSortFor(field: string): 'ascending' | 'descending' | 'none' {
    const state = this.sortState();
    if (state?.field !== field) return 'none';
    return state.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIconClasses(direction: DynamoTreeTableSortDirection | 'none') {
    return cn(
      treeTableSortIconStyles({ direction }),
      this.ptFor('sortIcon').class,
    );
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
   * single-column sort only, mirrors Table's own `toggleSort` exactly,
   * including its page-reset (sorting re-sorts each level's siblings
   * in-place, so it never changes which roots exist or their count — the
   * reset is purely for the same disorientation reason Table resets: a
   * paginated table showing a jumbled mid-list slice under the new order).
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
    this.page.set(1);
    this.emitLazyLoad();
  }

  /** Wired to `<dg-input-text>`'s `(valueChange)` — mirrors Table's own `onFilterTextChange` exactly, including the page-reset-in-the-same-handler technique (no `effect()` needed). */
  protected onFilterTextChange(value: string): void {
    if (this.isBusy()) return;
    this.filterText.set(value);
    this.page.set(1);
    this.emitLazyLoad();
  }

  /** Builds the template context handed to a column's `filterTemplate`. */
  protected columnFilterContext(
    column: DynamoTreeTableColumn<TRow>,
  ): DynamoTreeTableColumnFilterContext<TRow> {
    const value = this.columnFilters()[column.field];
    return {
      $implicit: value,
      value,
      setValue: (next) => this.onColumnFilterChange(column.field, next),
      column,
    };
  }

  /** String coercion for the built-in `<dg-input-text>` column filter's `[value]` binding. */
  protected columnFilterValue(field: string): string {
    const value = this.columnFilters()[field];
    return value === undefined || value === null ? '' : String(value);
  }

  /** Mirrors `onFilterTextChange`'s page-reset-in-the-same-handler pattern. */
  protected onColumnFilterChange(field: string, value: unknown): void {
    if (this.isBusy()) return;
    this.columnFilters.update((filters) => ({ ...filters, [field]: value }));
    this.page.set(1);
    this.emitLazyLoad();
  }

  /** Replaces the template's old `[(page)]`/`(pageSizeChange)="pageSize.set($event)"` two-way sugar — needed so a page/size change can also emit `lazyLoad`. */
  protected onPageChange(value: number): void {
    this.page.set(value);
    this.emitLazyLoad();
  }

  protected onPageSizeChange(value: number): void {
    this.pageSize.set(value);
    this.emitLazyLoad();
  }

  /**
   * Single, effect-free emission point for `lazyLoad` — called as a
   * trailing statement from every one of TreeTable's own state-changing
   * handlers (sort/filter/column-filter/page/pageSize), mirroring Table's
   * identical pattern. NOT called from `toggleExpanded`/`toggleChecked`/
   * `toggleSelectAll` — expand/select are purely local-display concerns for
   * already-loaded data. Not triggered by a consumer writing directly to
   * the underlying models from outside TreeTable's own UI — a documented,
   * accepted gap matching Table's own effect-free architecture.
   */
  private emitLazyLoad(): void {
    if (!this.lazy()) return;
    this.lazyLoad.emit({
      page: this.currentPage(),
      pageSize: this.pageSize() ?? this.totalItemCount(),
      sort: this.sortState(),
      filterText: this.filterText(),
      columnFilters: this.columnFilters(),
    });
  }

  /**
   * Toggles `expandedIds`; additionally emits `nodeExpand` when expanding a
   * node whose children aren't loaded yet (`leaf === false`, no
   * `children`) — see `DynamoTreeTableNode.leaf`'s own doc comment. Fires
   * from both the chevron click and keyboard (`ArrowRight`/`Enter`/
   * `Space`), since both funnel through this one method.
   */
  protected toggleExpanded(node: DynamoTreeTableNode<TRow>): void {
    if (this.isBusy()) return;
    const current = this.expandedIds();
    const id = node.id;
    const expanding = !current.includes(id);
    this.expandedIds.set(
      expanding
        ? [...current, id]
        : current.filter((existing) => existing !== id),
    );
    if (expanding && node.leaf === false && !node.children?.length) {
      this.nodeExpand.emit(node);
    }
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
   * Checks/unchecks every node on the CURRENT PAGE's roots (or the whole
   * tree, when unpaginated, since `pagedRoots()` already equals
   * `filteredItems()` in that case) — not every root across every page. A
   * bulk operation, so (mirroring Table's own `toggleSelectAll` and Tree's
   * cascade convention) it does NOT fire `itemSelect`. Selections made on
   * other pages are preserved either way — only this page's membership is
   * toggled.
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
    const roots = this.pagedRoots();
    const selectedIds = this.selectedSet();
    const shouldCheck = roots.some((node) =>
      shouldCascadeCheck(node, selectedIds),
    );
    const idsOnPage = new Set(roots.flatMap((node) => collectCascadeIds(node)));
    if (!shouldCheck) {
      this.selected.set(this.selected().filter((id) => !idsOnPage.has(id)));
      return;
    }
    this.selected.set([
      ...this.selected().filter((id) => !idsOnPage.has(id)),
      ...idsOnPage,
    ]);
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
          this.toggleExpanded(entry.node);
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
          this.toggleExpanded(entry.node);
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
          this.toggleExpanded(entry.node);
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
    this.focusRow(entry.node.id, index);
  }

  /**
   * Looks up a row by `data-row-id` instead of an index-keyed
   * `viewChildren` array — needed because `virtualScroll` only mounts rows
   * near the viewport, so a target row may not exist in the DOM at all.
   * Applied uniformly to both render paths (not just the virtualized one),
   * which also removes the native path's own prior index-fragility.
   *
   * When the target isn't currently mounted, scrolls the CDK viewport to
   * it first, then polls for it to appear before focusing — confirmed via
   * live testing in a real browser that a single `afterNextRender` fires
   * too early: CDK's own mount in response to `scrollToIndex` settles over
   * several of its own internal render passes (triggered by its scroll
   * listener, not synchronously with the `scrollToIndex` call), not just
   * the next one, so a single next-render callback found nothing and
   * silently no-opped — the viewport visibly scrolled and the row looked
   * "active" (that part is driven by `activeIdSignal`, set synchronously
   * above), but real DOM focus never landed.
   */
  private focusRow(id: string, index: number): void {
    const existing = this.findRowElement(id);
    if (existing) {
      existing.focus();
      return;
    }
    if (!this.virtualScroll()) return;
    this.virtualScrollRef()?.scrollToIndex(index);
    this.pollForRowAndFocus(id, 20);
  }

  private pollForRowAndFocus(id: string, framesLeft: number): void {
    if (framesLeft <= 0) return;
    requestAnimationFrame(() => {
      const row = this.findRowElement(id);
      if (row) {
        row.focus();
        return;
      }
      this.pollForRowAndFocus(id, framesLeft - 1);
    });
  }

  // Scans rather than building a `[data-row-id="${id}"]` selector string —
  // `CSS.escape` isn't implemented in every test/runtime environment (confirmed
  // missing in this project's jsdom setup), and a scan sidesteps needing it
  // at all. The mounted row count is always small (virtualized: only rows
  // near the viewport; unvirtualized: the full visible list either way).
  private findRowElement(id: string): HTMLElement | null {
    const rows =
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>(
        '[data-row-id]',
      );
    for (const row of Array.from(rows)) {
      if (row.dataset['rowId'] === id) return row;
    }
    return null;
  }

  /**
   * Dev-only misconfiguration guard, mirroring Table's own `ngOnInit`.
   * `lazy` + `virtualScroll` is deliberately NOT warned about here, unlike
   * Table — see `virtualScroll`'s own doc comment for why TreeTable's
   * top-level `lazy` (root-page-fetch) composes fine with virtualizing the
   * resulting flattened row list, unlike Table's `lazy` (which has no
   * fetch-more-on-scroll hook at all).
   */
  ngOnInit(): void {
    if (!isDevMode()) return;
    if (this.lazy() && this.totalRecords() === undefined) {
      console.warn(
        "[dg-tree-table] `lazy` is on without `totalRecords` — `pageCount` falls back to `items().length` (the current page's own root count), which is almost certainly not the real total. Set `totalRecords`.",
      );
    }
  }
}
