import type { TemplateRef } from '@angular/core';
import type { DynamoSize } from '@dynamong/core/api';

export type DynamoTableSize = DynamoSize;
export type DynamoTablePart = 'root';

/**
 * Template context handed to a column's `cellTemplate`, matching Angular's
 * `let row` / `let-x="name"` template-variable conventions.
 */
export interface DynamoTableCellContext<TRow> {
  /** The row itself. Bind with Angular's implicit shorthand: `let row`. */
  $implicit: TRow;
  /** Same value as `$implicit`, available under an explicit name: `let-row="row"`. */
  row: TRow;
  /**
   * The row's absolute position in `sortedData()` (the filtered + sorted
   * array, BEFORE pagination slices it) — NOT its position within the
   * current page. This matches `trackBy`'s own index convention (see
   * `trackRow`/`absoluteIndex` in `table.ts`), not `selectionKey`'s (a
   * fixed `0`, always ignored) — `index` here is a display concern like
   * `trackRow`'s, not a positional-identity concern like selection's. A
   * `cellTemplate` that reads `index` (e.g. to render a row number)
   * therefore sees a stable value whether or not the orthogonal, opt-in
   * `pageSize` input is set.
   */
  index: number;
}

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
   * Display-only for the default text-interpolation render path — never
   * used as the sort accessor (see `table.sort.ts`), but IS what the
   * global filter searches against (see `table.filter.ts`) — filtering and
   * sorting deliberately disagree on this: filtering matches what's
   * conceptually shown to the user, sorting orders by the real underlying
   * value. `cellTemplate`, when set, overrides how this value renders but
   * does not change what `cell`/`field` themselves compute.
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
  /**
   * Opts this column OUT of the global filter's search (`filterText`) when
   * explicitly `false` — e.g. an actions/template column with no
   * meaningful searchable text. Omitting it defaults to `true` (included)
   * — the OPPOSITE default polarity from `sortable`, which defaults to
   * excluded when omitted, since most columns are expected to be
   * searchable but not every column is expected to be sortable.
   */
  filterable?: boolean;
  /**
   * Renders this column's `<td>` via an Angular template instead of the
   * plain `cellValue(row, column)` text interpolation — for badges, icons,
   * buttons, or any markup a plain string can't express. Obtain a
   * `TemplateRef` the standard Angular way in your OWN component (e.g.
   * `readonly rowTpl = viewChild.required(TemplateRef)` reading an
   * `<ng-template #rowTpl let-row let-i="index">` you wrote), then assign
   * it to this column's `cellTemplate` when building your `columns` array
   * — Table has no content-projection machinery of its own for this; it
   * only renders whatever `TemplateRef` it's handed via `NgTemplateOutlet`.
   *
   * Display-only, exactly like `cell` — sorting (`table.sort.ts`) and the
   * global filter (`table.filter.ts`) never read `cellTemplate`; they
   * always read `cellValue(row, column)` (`cell(row)` if set, else
   * `row[field]`). Set both `cell` (for sort/filter) and `cellTemplate`
   * (for display) independently on the same column when what a column
   * sorts/filters by should differ from what it visually renders.
   */
  cellTemplate?: TemplateRef<DynamoTableCellContext<TRow>>;
}
