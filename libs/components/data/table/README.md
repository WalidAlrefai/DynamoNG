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

| Input                   | Type                                                   | Default              | Description                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`               | `DynamoTableColumn<TRow>[]` (required)                 | —                    |                                                                                                                                                                                                                              |
| `data`                  | `readonly TRow[]` (required)                           | —                    |                                                                                                                                                                                                                              |
| `size`                  | `DynamoTableSize`                                      | `'md'`               |                                                                                                                                                                                                                              |
| `emptyMessage`          | `string`                                               | `'No data'`          |                                                                                                                                                                                                                              |
| `loading`               | `boolean`                                              | `false`              | Renders a spinner + message in the empty-state slot and makes sorting, selection, filtering, and pagination non-interactive. A non-empty table shows no dimming/overlay while loading — only `aria-busy` on the root reacts. |
| `loadingMessage`        | `string`                                               | `'Loading…'`         | Shown in the empty-state slot instead of `emptyMessage`/`noMatchesMessage` while `loading` is true.                                                                                                                          |
| `ariaLabel`             | `string \| undefined`                                  | `undefined`          |                                                                                                                                                                                                                              |
| `trackBy`               | `((row: TRow, index: number) => unknown) \| undefined` | `undefined`          | `@for` track escape hatch; also the identity source for row selection membership. Falls back to row-object reference equality.                                                                                               |
| `pageSize`              | `number \| undefined` (model)                          | `undefined`          | Opt-in pagination. Unset renders every row with no pagination UI.                                                                                                                                                            |
| `pageSizeOptions`       | `number[]`                                             | `[10, 25, 50, 100]`  |                                                                                                                                                                                                                              |
| `page`                  | `number` (model)                                       | `1`                  | 1-indexed.                                                                                                                                                                                                                   |
| `selectable`            | `boolean`                                              | `false`              | Unset renders no selection column.                                                                                                                                                                                           |
| `selected`              | `TRow[]` (model)                                       | `[]`                 | The selected row objects (not indices).                                                                                                                                                                                      |
| `filterable`            | `boolean`                                              | `false`              | Renders a search `<input>` above the table.                                                                                                                                                                                  |
| `filterPlaceholder`     | `string`                                               | `'Search...'`        |                                                                                                                                                                                                                              |
| `filterText`            | `string` (model)                                       | `''`                 | Case-insensitive substring match; blank matches every row.                                                                                                                                                                   |
| `noMatchesMessage`      | `string`                                               | `'No matching rows'` | Shown instead of `emptyMessage` when `data` has rows but the active filter matched none.                                                                                                                                     |
| `virtualScroll`         | `boolean`                                              | `false`              | Renders the body through `@dynamong/virtual-scroll`. Not supported together with `pageSize` or `selectable` in v1.                                                                                                           |
| `virtualScrollItemSize` | `number`                                               | `40`                 |                                                                                                                                                                                                                              |
| `virtualScrollHeight`   | `number`                                               | `400`                |                                                                                                                                                                                                                              |

## Outputs

| Output             | Payload  | Fires when                                                                                                                        |
| ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pageChange`       | `number` | `page` changes (auto-generated by `model()`).                                                                                     |
| `selectedChange`   | `TRow[]` | `selected` changes (auto-generated by `model()`).                                                                                 |
| `filterTextChange` | `string` | `filterText` changes.                                                                                                             |
| `itemSelect`       | `TRow`   | A user directly checks/unchecks a single row — not from `toggleSelectAll()` (the header checkbox), which only updates `selected`. |

## Accessibility

- Semantic `<table>`/`<thead>`/`<tbody>` (or a CSS-Grid-with-explicit-ARIA-roles equivalent while `virtualScroll` is on); sortable headers are `<button>`s announcing `aria-sort`.
- The header/row checkboxes are labeled native `<input type="checkbox">`s; the header checkbox reflects indeterminate state via its DOM property.
- `aria-busy` on the root wrapper reflects `loading`.

## Tier / dependencies

- `tier:3`. Peer dependencies: `@dynamong/checkbox`, `@dynamong/input-text`, `@dynamong/pagination`, `@dynamong/spinner`, `@dynamong/virtual-scroll`.

## Running unit tests

Run `nx test data-table` to execute the unit tests.
