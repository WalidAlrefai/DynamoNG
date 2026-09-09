import type { TemplateRef } from '@angular/core';

export type DynamoTreeTablePart =
  | 'root'
  | 'table'
  | 'headerRow'
  | 'headerCell'
  | 'row'
  | 'cell'
  | 'chevron';

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

/**
 * Independently duplicated from `DynamoTableColumn`'s shape, dropping
 * `filterable`/`sortFn` — TreeTable v1 has no global filter, and a custom
 * per-column sort function isn't worth the complexity budget alongside the
 * genuinely new per-level recursive sort (see tree-table.ts).
 */
export interface DynamoTreeTableColumn<TRow> {
  /** Stable identity key — the sort-state key, and (when `cell` is omitted) the property read directly off `data` via `data[field]`. */
  field: string;
  header: string;
  sortable?: boolean;
  /** Display value; NEVER used as the sort accessor (sorting always reads the raw `field`, same split Table's own `cell`/sort logic makes). */
  cell?: (row: TRow) => unknown;
  cellTemplate?: TemplateRef<DynamoTreeTableCellContext<TRow>>;
}
