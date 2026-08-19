import type { DynamoSize } from '@dynamong/core/api';

export type DynamoTableSize = DynamoSize;
export type DynamoTablePart = 'root';

export interface DynamoTableColumn<TRow> {
  /**
   * Stable identity key — the `@for` track key, the sort-state key, and
   * (when `cell` is omitted) the property read directly off each row via
   * `row[field]`. A plain `string` rather than `keyof TRow` — a
   * computed/derived column still needs an identity key even when it has
   * no single backing property.
   */
  field: string;
  header: string;
  /** Renders a clickable sort-cycling button in the header when true. */
  sortable?: boolean;
  /**
   * Computes the *displayed* cell value. Defaults to `row[field]`.
   * Display-only — never used as the sort accessor (see `table.sort.ts`).
   */
  cell?: (row: TRow) => unknown;
  /**
   * Overrides the default comparator entirely. Same contract as
   * `Array.prototype.sort`'s comparator (return < 0 when `a` sorts before
   * `b` in ASCENDING order) — the table negates the result for descending,
   * don't bake direction-handling into `sortFn` yourself. Null/undefined
   * values are not specially handled for a custom `sortFn`.
   */
  sortFn?: (a: TRow, b: TRow) => number;
}
