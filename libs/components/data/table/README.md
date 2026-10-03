# @dynamong/table

A data table with column sorting, opt-in row selection, an opt-in global
filter, opt-in pagination, and an opt-in virtualized body for large
datasets.

## Usage

```html
<dg-table
  [columns]="columns"
  [data]="rows"
  [selectable]="true"
  [(selected)]="selectedRows"
  [filterable]="true"
  [loading]="isFetching()"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected readonly columns: DynamoTableColumn<Person>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'age', header: 'Age', sortable: true },
];

protected onItemSelect(row: Person): void { ... }
```

## Inputs

| Input                   | Type                                                     | Default              | Description                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`               | `DynamoTableColumn<TRow>[]` (required)                   | —                    |                                                                                                                                                                                                                              |
| `data`                  | `readonly TRow[]` (required)                             | —                    |                                                                                                                                                                                                                              |
| `sortMode`              | `'single' \| 'multiple'`                                 | `'single'`           | `'multiple'` lets a shift-click add/cycle a column as an extra sort key without clearing the others; a plain click always still collapses to a single key, in either mode.                                                   |
| `size`                  | `DynamoTableSize`                                        | `'md'`               |                                                                                                                                                                                                                              |
| `emptyMessage`          | `string`                                                 | `'No data'`          |                                                                                                                                                                                                                              |
| `loading`               | `boolean`                                                | `false`              | Renders a spinner + message in the empty-state slot and makes sorting, selection, filtering, and pagination non-interactive. A non-empty table shows no dimming/overlay while loading — only `aria-busy` on the root reacts. |
| `loadingMessage`        | `string`                                                 | `'Loading…'`         | Shown in the empty-state slot instead of `emptyMessage`/`noMatchesMessage` while `loading` is true.                                                                                                                          |
| `ariaLabel`             | `string \| undefined`                                    | `undefined`          |                                                                                                                                                                                                                              |
| `ariaDescribedby`       | `string \| undefined`                                    | `undefined`          | Associates the table with an external help/error message element via `aria-describedby`.                                                                                                                                     |
| `fluid`                 | `boolean`                                                | `true`               | Fills the width of its container; set `false` for content-driven/intrinsic sizing.                                                                                                                                           |
| `filterAriaLabel`       | `string`                                                 | `'Search table'`     | Accessible name for the search `<input>` rendered when `filterable` is `true`.                                                                                                                                               |
| `trackBy`               | `((row: TRow, index: number) => unknown) \| undefined`   | `undefined`          | `@for` track escape hatch; also the identity source for row selection membership. Falls back to row-object reference equality.                                                                                               |
| `pageSize`              | `number \| undefined` (model)                            | `undefined`          | Opt-in pagination. Unset renders every row with no pagination UI.                                                                                                                                                            |
| `pageSizeOptions`       | `number[]`                                               | `[10, 25, 50, 100]`  |                                                                                                                                                                                                                              |
| `page`                  | `number` (model)                                         | `1`                  | 1-indexed.                                                                                                                                                                                                                   |
| `selectable`            | `boolean`                                                | `false`              | Unset renders no selection column.                                                                                                                                                                                           |
| `selected`              | `TRow[]` (model)                                         | `[]`                 | The selected row objects (not indices).                                                                                                                                                                                      |
| `filterable`            | `boolean`                                                | `false`              | Renders a search `<input>` above the table.                                                                                                                                                                                  |
| `filterPlaceholder`     | `string`                                                 | `'Search...'`        |                                                                                                                                                                                                                              |
| `filterText`            | `string` (model)                                         | `''`                 | Case-insensitive substring match; blank matches every row.                                                                                                                                                                   |
| `noMatchesMessage`      | `string`                                                 | `'No matching rows'` | Shown instead of `emptyMessage` when `data` has rows but the active filter matched none.                                                                                                                                     |
| `columnFilters`         | `Record<string, unknown>` (model)                        | `{}`                 | Per-column filter values keyed by `column.field` — see "Per-column filtering" below. Composes with `filterText` as a logical AND.                                                                                            |
| `expansionTemplate`     | `TemplateRef<DynamoTableCellContext<TRow>> \| undefined` | `undefined`          | Opt-in row expansion. Setting it renders a leading chevron column; an expanded row shows this template in a full-width detail row beneath it. Ignored (with a dev warning) under `virtualScroll`.                            |
| `expandedRows`          | `TRow[]` (model)                                         | `[]`                 | Two-way bindable array of the expanded row objects. Row identity follows `trackBy`, like selection.                                                                                                                          |
| `expandMode`            | `'multiple' \| 'single'`                                 | `'multiple'`         | `'single'` is accordion-style: expanding a row collapses the others.                                                                                                                                                         |
| `virtualScroll`         | `boolean`                                                | `false`              | Renders the body through `@dynamong/virtual-scroll`. Not supported together with `pageSize` (a deliberate, permanent exclusion — see Design notes). `selectable` IS supported here.                                          |
| `virtualScrollItemSize` | `number`                                                 | `40`                 |                                                                                                                                                                                                                              |
| `virtualScrollHeight`   | `number`                                                 | `400`                |                                                                                                                                                                                                                              |
| `lazy`                  | `boolean`                                                | `false`              | Opt-in server-driven mode — see "Lazy / server-driven mode" below. Not supported together with `virtualScroll` (dev warning).                                                                                                |
| `totalRecords`          | `number \| undefined`                                    | `undefined`          | Required in `lazy` mode for a correct `pageCount` (dev warning if omitted). Ignored otherwise.                                                                                                                               |

## Outputs

| Output             | Payload                    | Fires when                                                                                                                        |
| ------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pageChange`       | `number`                   | `page` changes (auto-generated by `model()`).                                                                                     |
| `selectedChange`   | `TRow[]`                   | `selected` changes (auto-generated by `model()`).                                                                                 |
| `filterTextChange` | `string`                   | `filterText` changes.                                                                                                             |
| `itemSelect`       | `TRow`                     | A user directly checks/unchecks a single row — not from `toggleSelectAll()` (the header checkbox), which only updates `selected`. |
| `lazyLoad`         | `DynamoTableLazyLoadEvent` | `lazy` mode only — fires whenever page/pageSize/sort/either filter changes via Table's own UI. See "Lazy / server-driven mode".   |

## Accessibility

- Semantic `<table>`/`<thead>`/`<tbody>` (or a CSS-Grid-with-explicit-ARIA-roles equivalent while `virtualScroll` is on); sortable headers are `<button>`s announcing `aria-sort`.
- The header/row checkboxes are labeled native `<input type="checkbox">`s; the header checkbox reflects indeterminate state via its DOM property.
- `aria-busy` on the root wrapper reflects `loading`.

## Design notes

**No `variant` input.** Unlike form controls (Select, InputText, etc.), Table has no outlined/filled
surface distinction anywhere in its visual language — the wrapper is a single bordered card. Forcing an
`outlined`/`filled` toggle onto the header row or card wrapper would duplicate what `styleClass`/`pt`/
`unstyled` already let a consumer do, with no identified real design need. Use those for bespoke chrome
instead.

**Absolute, not page-relative, row numbers in ARIA labels.** The expand-button `aria-label` and the
selection checkbox's `sr-only` label both announce the row's _absolute_ position in the full sorted/
filtered set (e.g. "Expand row 11" for the first row on page 2 of a `pageSize=10` table), not its
position within the current page — matching every other index-sensitive part of the component
(`trackBy`, `cellTemplate`'s `index` context). A page-relative number would restart from 1 on every
page, misleading a screen-reader user about where they actually are in the data.

**`aria-sort="none"` for sortable-but-unsorted columns.** A sortable column's header explicitly carries
`aria-sort="none"` until it's actively sorted (not simply omitted) — WAI-ARIA authoring practice wants
this explicit value so assistive tech can distinguish "sortable, not currently sorted" from "not
sortable at all" (a non-sortable column still correctly has no `aria-sort` attribute at all).

**Per-column filtering.** Give a column its own `columnFilter` config to render a second header row
with a filter input scoped to just that column:

```ts
{ field: 'age', header: 'Age', columnFilter: { placeholder: 'Filter age' } }
```

`columnFilter` is distinct from `filterable` above — `filterable` only controls whether a column
participates in the single _global_ `filterText` search; `columnFilter` renders its own per-column
input and composes with the global filter as a logical **AND**, never replacing it. The default
`'text'` type renders Table's own built-in search `<input>` with the same case-insensitive substring
semantics as the global filter; set `type: 'custom'` plus a `filterTemplate` (obtained the same way as
`cellTemplate`) to render arbitrary filter UI instead, receiving a `{ $implicit, value, setValue,
column }` context — call `setValue(newValue)` to write back into `columnFilters` (which also resets
`page` to 1, same as every other filter-changing interaction). Override the default substring
predicate entirely with `columnFilter.predicate: (row, value) => boolean` when a column's filter value
isn't a plain string (dates, option objects, etc.).

**Lazy / server-driven mode.** Set `lazy` to hand sorting/filtering/pagination off to your own data
source instead of Table's internal pipeline:

```html
<dg-table
  [columns]="columns"
  [data]="page"
  [lazy]="true"
  [totalRecords]="total"
  [loading]="isFetching()"
  (lazyLoad)="fetchPage($event)"
/>
```

While `lazy` is on, `data()` is expected to hold **only the current page's already-filtered/sorted
rows** — Table no longer filters, sorts, or slices it itself, and `totalRecords` (not `data().length`)
drives `pageCount`/the pagination summary. Table emits `lazyLoad` — a `DynamoTableLazyLoadEvent`
(`page`, `pageSize`, `sort: DynamoTableSortDescriptor[]`, `filterText`, `columnFilters`) — whenever
page, page size, sort, or either filter changes via Table's own UI (a sort-header click, typing in a
filter box, a pagination control); your handler re-fetches the matching slice and re-binds `data`/
`totalRecords`. Reuses Table's own primitives (1-indexed `page`, the real multi-sort array) rather than
a PrimeNG-style `first`/`rows`/single-`sortField` shape, since Table already exposes richer state than
that as its own public API.

Three things to know:

- **Not triggered by programmatic model writes.** `lazyLoad` only fires from Table's own UI call
  sites — writing directly to `page`/`filterText`/`columnFilters`/`sortState` from outside Table (e.g.
  calling `.set(...)` on a model yourself) does not emit it. This keeps Table effect-free, consistent
  with its entire existing architecture; drive those writes through Table's own UI, or call your fetch
  function directly alongside your own write.
- **`selected`/`expandedRows` need a `trackBy` to survive a re-fetch.** The model arrays themselves are
  never touched by re-fetching — but without a `trackBy`, a fresh fetch of a previously-visited page
  returns new row-object references for logically-the-same rows, and selection/expansion _visually_
  clears for that page (identity no longer matches by `===`) even though `selected()`/`expandedRows()`
  still hold the old objects. A dev-mode console warning flags this when `lazy` + `selectable`/
  `expansionTemplate` is on without a `trackBy`.
- **Not combined with `virtualScroll`** (dev warning, not a hard block) — the virtualized path has no
  fetch-more-on-scroll hook, so `lazy` would be silently inert there. True infinite-scroll lazy loading
  is a larger, separate feature, not covered by this input.

`loading` (the existing input) doubles as lazy mode's "waiting on the server" indicator — no separate
flag exists; set it to `true` in your `lazyLoad` handler and back to `false` once `data()`/
`totalRecords()` are updated.

**Multi-column sort.** `sortMode="multiple"` doesn't change how a plain click behaves — it still collapses to
a single sort key, cycling ascending -> descending -> unsorted, exactly like `sortMode="single"`. Shift-click
a _different_ sortable column to add it as a secondary (or tertiary, ...) key instead, without disturbing the
columns already active; shift-clicking an already-active key cycles its own direction, and shift-clicking it
past descending removes just that one key. Later keys only ever break ties left by earlier ones — they never
override a decisive earlier comparison. Once 2+ keys are active, each sorted header shows a small numbered
badge (1, 2, ...) next to its sort icon indicating priority; a single active key never shows one, matching
`sortMode="single"`'s own header exactly.

**Row expansion.** Pass a `TemplateRef` (obtained the same way as a column's `cellTemplate`) as `expansionTemplate`; it gets the `{ $implicit, row, index }` context. Each row gets a chevron `<button>` with `aria-expanded`/`aria-controls`, and the detail renders in a second `<tr>` spanning every column. Expansion is keyed by row identity (`trackBy` or reference), so it survives sorting, filtering and paging. It is not available with `virtualScroll` (that grid has no detail-row slot).

**Page-out-of-range clamping.** `page`'s _read_ is clamped into
`[1, pageCount]` without ever writing back to `page` itself — if an
externally-bound `page` is left out of range (e.g. `data` shrank while
the consumer's own signal still pointed at page 3), the table silently
renders the clamped page without correcting the bound `page` value until
the user clicks Prev/Next (which read from the clamped value, so the
click writes the corrected value back).

**Selection identity without `trackBy`.** Row selection membership uses
`trackBy` when provided (a pure function of the row alone, e.g.
`(row) => row.id`); without one, it falls back to `===` reference
equality, so selection does not survive a wholesale `data` array
replacement in that case. Provide `trackBy` whenever rows are recreated
on every render and selection needs to survive it.

**`virtualScroll` + `pageSize`/`selectable`.** `pageSize` stays a
deliberate, permanent exclusion — virtualizing an already-small paginated
page defeats the purpose, so `virtualScroll` renders `sortedData()`
directly and hides the pagination footer. `selectable` IS supported on
the virtualized path: the checkbox column is a leading grid cell there,
same mechanics as the native path's fixed-width column.

## Passthrough (`pt`)

`pt.root` merges onto the outer wrapper `<div>`. `pt.table`/`pt.headerRow`/`pt.bodyRow` each target the
_same_ part across both render paths — the native `<table>`/`<tr>` and the virtualized `role="table"`/
`role="row"` divs — rather than separate part names per path. `pt.headerCell`/`pt.sortButton`/
`pt.sortIcon`/`pt.bodyCell` apply to every matching header/body element; `pt.selectionCell`/
`pt.selectionCheckbox` apply to both the header "select all" row and every body row's own checkbox;
`pt.expandCell`/`pt.expandButton`/`pt.expandIcon`/`pt.detailCell` apply once row expansion is enabled.
`pt.filterWrapper` targets the filter bar, `pt.filterInput` forwards into the filter box's own
`<dg-input-text>` `pt.input`. `pt.columnFilterRow`/`pt.columnFilterCell` target the optional
per-column-filter header row and its cells; `pt.columnFilterInput` forwards into each built-in
per-column filter's own `<dg-input-text>` `pt.input` (not applied when a column uses a custom
`filterTemplate` instead). `pt.paginationWrapper` targets the footer bar, `pt.pagination` forwards
into `<dg-pagination>`'s own `pt.root` — note `@dynamong/pagination` hasn't been `pt`-reviewed yet, so
this forwarding is a no-op on the rendered DOM until that round ships; Table's own responsibility (correctly
forwarding the object) is complete regardless. `class` is merged into each part's own built-in classes;
every other key is set as a literal DOM attribute via `@dynamong/core/base`'s `DynamoPassThroughDirective`.

## Tier / dependencies

- `tier:3`. Peer dependencies: `@dynamong/core`, `@dynamong/checkbox`, `@dynamong/input-text`, `@dynamong/pagination`, `@dynamong/spinner`, `@dynamong/virtual-scroll`.

## Running unit tests

Run `nx test data-table` to execute the unit tests.
