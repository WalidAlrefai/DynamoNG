import type { TemplateRef } from '@angular/core';

export type DynamoTreeTablePart =
  | 'root'
  | 'filterWrapper'
  | 'filterInput'
  | 'table'
  | 'headerRow'
  | 'headerCell'
  | 'sortButton'
  | 'sortIcon'
  | 'row'
  | 'cell'
  | 'selectionCell'
  | 'selectionCheckbox'
  | 'chevronButton'
  | 'chevron'
  | 'columnFilterRow'
  | 'columnFilterCell'
  | 'columnFilterInput'
  | 'paginationWrapper'
  | 'pagination';

export type DynamoTreeTableSortDirection = 'asc' | 'desc';

/**
 * A tree-table node wraps the consumer's own row shape (`data`) plus
 * recursive `children` — independently duplicated from `DynamoTreeNode`
 * (whose `value` is a single opaque payload, not a multi-field row a
 * column API can read `field`s off of). Identity is `id`-based, matching
 * `DynamoTreeNode`'s own convention exactly (unlike `DynamoPanelMenuItem`,
 * which went path-based specifically because the menu-family's item shape
 * has no `id` by convention — TreeTable is explicitly "Tree plus columns,"
 * so it keeps Tree's own identity scheme).
 */
export interface DynamoTreeTableNode<TRow> {
  id: string;
  data: TRow;
  children?: DynamoTreeTableNode<TRow>[];
  disabled?: boolean;
  /**
   * Marks a node whose children exist server-side but aren't loaded yet —
   * distinct from an absent/empty `children` meaning "genuine leaf".
   * `leaf === false` with no `children` shows a chevron speculatively; the
   * first expand emits `nodeExpand` instead of just toggling locally. The
   * consumer must write real `children` back (and/or flip `leaf` to `true`
   * if the node turns out to be genuinely empty) or the node shows a
   * loading spinner forever. Omitted (the default) behaves exactly as
   * before: a childless node never shows a chevron.
   */
  leaf?: boolean;
}

/**
 * Template context handed to a column's `cellTemplate`, matching Angular's
 * `let row` / `let-x="name"` template-variable conventions — same shape as
 * `DynamoTableCellContext`, plus `node`/`depth` (unlike flat Table, a
 * tree-table cell template may want to know its row's tree position).
 */
export interface DynamoTreeTableCellContext<TRow> {
  /** The row's data. Bind with Angular's implicit shorthand: `let row`. */
  $implicit: TRow;
  /** Same value as `$implicit`, available under an explicit name: `let-row="row"`. */
  row: TRow;
  node: DynamoTreeTableNode<TRow>;
  depth: number;
}

export type DynamoTreeTableColumnFilterType = 'text' | 'custom';

/** Byte-identical shape to Table's own `DynamoTableColumnFilterConfig` — no hierarchy-specific change needed at this level (the hierarchy-awareness all lives in `filterTree`). */
export interface DynamoTreeTableColumnFilterConfig<TRow> {
  /** `'text'` (default) renders a built-in `<dg-input-text type="search">`; `'custom'` renders `column.filterTemplate` instead. */
  type?: DynamoTreeTableColumnFilterType;
  placeholder?: string;
  /** Overrides the default substring-match predicate — required in practice for a `'custom'` filter whose value isn't a plain string. */
  predicate?: (row: TRow, value: unknown) => boolean;
}

/** Template context handed to a column's `filterTemplate`, mirroring Table's own `DynamoTableColumnFilterContext`. */
export interface DynamoTreeTableColumnFilterContext<TRow> {
  /** The filter's current value. Bind with Angular's implicit shorthand: `let value`. */
  $implicit: unknown;
  /** Same value as `$implicit`, available under an explicit name: `let-value="value"`. */
  value: unknown;
  /** Writes the new value into `columnFilters` and resets `page` to 1. */
  setValue: (value: unknown) => void;
  column: DynamoTreeTableColumn<TRow>;
}

/**
 * Independently duplicated from `DynamoTableColumn`'s shape, dropping
 * `sortFn` — a custom per-column sort function isn't worth the complexity
 * budget alongside the genuinely new per-level recursive sort (see
 * tree-table.ts). `filterable` was dropped in v1 (no global filter yet)
 * and reinstated once the filter was added.
 */
export interface DynamoTreeTableColumn<TRow> {
  /** Stable identity key — the sort-state key, and (when `cell` is omitted) the property read directly off `data` via `data[field]`. */
  field: string;
  header: string;
  sortable?: boolean;
  /** Display value; NEVER used as the sort accessor (sorting always reads the raw `field`, same split Table's own `cell`/sort logic makes). */
  cell?: (row: TRow) => unknown;
  cellTemplate?: TemplateRef<DynamoTreeTableCellContext<TRow>>;
  /**
   * Opts this column OUT of the global filter's search (`filterText`) when
   * explicitly `false` — e.g. a computed/actions column with no meaningful
   * searchable text. Omitting it defaults to `true` (included) — same
   * opt-out-by-default polarity as Table's own `filterable`.
   */
  filterable?: boolean;
  /** Opts this column INTO the per-column filter row (`columnFilters`). Omitted (the default) renders no filter cell for this column. */
  columnFilter?: DynamoTreeTableColumnFilterConfig<TRow>;
  /** Required when `columnFilter.type === 'custom'`; ignored otherwise. */
  filterTemplate?: TemplateRef<DynamoTreeTableColumnFilterContext<TRow>>;
}

/**
 * Payload for `lazyLoad`, emitted on every page/sort/filter-driven UI
 * interaction while `lazy` is `true` — mirrors Table's own
 * `DynamoTableLazyLoadEvent`, with one deliberate shape deviation: `sort`
 * is a single nullable descriptor, NOT an array. TreeTable never got
 * multi-column sort (`sortFn`/`sortMode` were dropped as a deliberate
 * complexity-budget call — see `DynamoTreeTableColumn`'s own doc comment),
 * so there's no array to generify over.
 */
export interface DynamoTreeTableLazyLoadEvent {
  page: number;
  pageSize: number;
  sort: { field: string; direction: DynamoTreeTableSortDirection } | null;
  filterText: string;
  columnFilters: Readonly<Record<string, unknown>>;
}
