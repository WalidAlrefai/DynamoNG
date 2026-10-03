import type { TemplateRef } from '@angular/core';
import type { DynamoSize } from '@dynamong/core/api';
import type { DynamoTableSortDescriptor } from './table.sort';

export type DynamoTableSize = DynamoSize;
/**
 * `'table'`/`'headerRow'`/`'bodyRow'` are each reused across both the native
 * `<table>` render path and the virtualized `role="table"` path — same
 * semantic part, same meaning, two DOM shapes — rather than duplicated into
 * per-path part names. `'selectionCell'`/`'selectionCheckbox'` are each
 * shared by the header "select all" row and every body row, matching how
 * the underlying style constants are already shared between them.
 */
export type DynamoTablePart =
  | 'root'
  | 'table'
  | 'headerRow'
  | 'headerCell'
  | 'sortButton'
  | 'sortIcon'
  | 'bodyRow'
  | 'bodyCell'
  | 'selectionCell'
  | 'selectionCheckbox'
  | 'expandCell'
  | 'expandButton'
  | 'expandIcon'
  | 'detailCell'
  | 'filterWrapper'
  | 'filterInput'
  | 'columnFilterRow'
  | 'columnFilterCell'
  | 'columnFilterInput'
  | 'paginationWrapper'
  | 'pagination';
export type DynamoTableSortMode = 'single' | 'multiple';

/** `'multiple'` lets any number of rows stay expanded; `'single'` is accordion-style (expanding one collapses the others). */
export type DynamoTableExpandMode = 'multiple' | 'single';

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

export type DynamoTableColumnFilterType = 'text' | 'custom';

/**
 * Opt-in per-column filter UI config, assigned onto a `DynamoTableColumn` via
 * its own `columnFilter` property — distinct from `filterable` above (which
 * only controls whether a column participates in the single GLOBAL
 * `filterText` search). `'text'` (default) renders Table's own built-in
 * per-column search `<input>` in a second header row — same case-insensitive
 * substring semantics as the global filter, just scoped to this one column.
 * `'custom'` instead renders `column.filterTemplate`, handing the consumer a
 * `DynamoTableColumnFilterContext` — same "consumer supplies the
 * `TemplateRef`, assigns it onto the column object" pattern `cellTemplate`
 * already uses, not a new content-projection mechanism.
 */
export interface DynamoTableColumnFilterConfig<TRow> {
  type?: DynamoTableColumnFilterType;
  /** Placeholder for the built-in `'text'` input; ignored for `'custom'`. */
  placeholder?: string;
  /**
   * Overrides the default substring-match predicate. Receives the row and
   * this column's current filter value (from `columnFilters()[field]`);
   * returns `true` to keep the row. Required in practice for `'custom'`
   * filters whose value isn't a plain string (e.g. a date range or a
   * multi-select of option values) — the default predicate just does a
   * case-insensitive substring match against the cell's own displayed
   * value, which is rarely right for non-text values.
   */
  predicate?: (row: TRow, value: unknown) => boolean;
}

/** Context handed to a column's `filterTemplate`, mirroring `DynamoTableCellContext`'s shape. */
export interface DynamoTableColumnFilterContext<TRow> {
  /** Current filter value for this column (`undefined` when inactive). Bind with `let value`. */
  $implicit: unknown;
  /** Same value as `$implicit`, available under an explicit name: `let-value="value"`. */
  value: unknown;
  /** Writes a new value into Table's `columnFilters` model and resets `page` to 1 — same
   *  page-reset mechanism `onFilterTextChange`/`toggleSort` already each own. */
  setValue: (value: unknown) => void;
  column: DynamoTableColumn<TRow>;
}

/**
 * Emitted from `lazy` mode whenever page, page size, sort, or either filter
 * changes — a consumer fetches the matching slice from its own data source
 * and feeds it back in via `data`/`totalRecords`, rather than Table
 * filtering/sorting/slicing the full set itself. Reuses Table's own
 * `page`/`pageSize`/`DynamoTableSortDescriptor`/`filterText`/`columnFilters`
 * primitives verbatim (1-indexed `page`, not a 0-indexed `first` offset) —
 * deliberately NOT `@dynamong/data-view`'s `DynamoDataViewLazyLoadEvent`
 * shape (`first`/`rows`/single `sortField`/`sortOrder`), since Table already
 * exposes richer multi-sort state and page/pageSize as its own public API.
 * Not generic over `TRow` — unlike `DynamoDataViewLazyLoadEvent<T>`'s
 * `sortField: keyof T`, `sort` here reuses `DynamoTableSortDescriptor`'s own
 * plain-`string` `field` (matching `DynamoTableColumn.field`'s identical
 * design — a computed/derived column needs an identity key even with no
 * single backing property), so no row-typed member exists to generify over.
 */
export interface DynamoTableLazyLoadEvent {
  page: number;
  pageSize: number;
  sort: DynamoTableSortDescriptor[];
  filterText: string;
  columnFilters: Readonly<Record<string, unknown>>;
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
  /** Opt-in per-column filter UI — see `DynamoTableColumnFilterConfig`'s own doc comment. */
  columnFilter?: DynamoTableColumnFilterConfig<TRow>;
  /** Required when `columnFilter.type === 'custom'`. Obtained the same way as `cellTemplate`. */
  filterTemplate?: TemplateRef<DynamoTableColumnFilterContext<TRow>>;
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
