# @dynamong/tree-table

A hierarchical table — Tree's expand/collapse rows combined with Table's
columns — for hierarchical data where each row also carries multiple
fields, not just a label. Sorting, an opt-in cascading-checkbox selection
column, a hierarchy-aware global filter, and opt-in pagination over root
nodes are all built in.

## Usage

```html
<dg-tree-table
  [items]="items"
  [columns]="columns"
  [(expandedIds)]="expanded"
  [selectable]="true"
  [(selected)]="checkedIds"
  [loading]="isFetching()"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected readonly columns: DynamoTreeTableColumn<FileEntry>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'size', header: 'Size' },
];

protected onItemSelect(node: DynamoTreeTableNode<FileEntry>): void { ... }
```

## Inputs

| Input               | Type                                       | Default              | Description                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`             | `DynamoTreeTableNode<TRow>[]` (required)   | —                    | Each node wraps the row's `data` plus recursive `children`.                                                                                                                                                                                                            |
| `columns`           | `DynamoTreeTableColumn<TRow>[]` (required) | —                    |                                                                                                                                                                                                                                                                        |
| `expandedIds`       | `string[]` (model)                         | `[]`                 |                                                                                                                                                                                                                                                                        |
| `ariaLabel`         | `string \| undefined`                      | `undefined`          |                                                                                                                                                                                                                                                                        |
| `emptyMessage`      | `string`                                   | `'No data'`          |                                                                                                                                                                                                                                                                        |
| `loading`           | `boolean`                                  | `false`              | Renders a spinner + message in the empty-state slot and makes sorting, expand/collapse, selection, and row navigation non-interactive.                                                                                                                                 |
| `loadingMessage`    | `string`                                   | `'Loading…'`         | Shown in the empty-state slot instead of `emptyMessage` while `loading` is true.                                                                                                                                                                                       |
| `selectable`        | `boolean`                                  | `false`              | Opt-in row selection. Unset renders no selection column.                                                                                                                                                                                                               |
| `selected`          | `string[]` (model)                         | `[]`                 | Every node id (leaf or branch) currently fully checked — same id-keyed shape as `expandedIds`. Checking a branch cascades to its enabled descendants, mirroring `@dynamong/tree`'s own selection model (not Table's flat one — the natural fit for hierarchical data). |
| `filterable`        | `boolean`                                  | `false`              | Renders a search `<input>` above the table. Matching is hierarchy-aware — see Design notes.                                                                                                                                                                            |
| `filterPlaceholder` | `string`                                   | `'Search...'`        |                                                                                                                                                                                                                                                                        |
| `filterText`        | `string` (model)                           | `''`                 | Case-insensitive substring match against every `filterable !== false` column.                                                                                                                                                                                          |
| `noMatchesMessage`  | `string`                                   | `'No matching rows'` | Shown instead of `emptyMessage` when `items` has nodes but the active filter matched none.                                                                                                                                                                             |
| `pageSize`          | `number \| undefined` (model)              | `undefined`          | Opt-in pagination over ROOT nodes only — see Design notes.                                                                                                                                                                                                             |
| `pageSizeOptions`   | `number[]`                                 | `[10, 25, 50, 100]`  |                                                                                                                                                                                                                                                                        |
| `page`              | `number` (model)                           | `1`                  | 1-indexed root-node page.                                                                                                                                                                                                                                              |

## Outputs

| Output              | Payload                     | Fires when                                                                                                                       |
| ------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `expandedIdsChange` | `string[]`                  | `expandedIds` changes (auto-generated by `model()`).                                                                             |
| `selectedChange`    | `string[]`                  | `selected` changes.                                                                                                              |
| `itemSelect`        | `DynamoTreeTableNode<TRow>` | A user directly checks/unchecks a single node — not from the header "select all" checkbox, and not once per cascaded descendant. |
| `filterTextChange`  | `string`                    | `filterText` changes (auto-generated by `model()`).                                                                              |
| `pageSizeChange`    | `number \| undefined`       | `pageSize` changes (auto-generated by `model()`).                                                                                |
| `pageChange`        | `number`                    | `page` changes (auto-generated by `model()`).                                                                                    |

## Accessibility

- `role="treegrid"` root, `role="row"` on every `<tr>` (header included), `role="gridcell"` on every `<td>`, with `aria-level`/`aria-expanded` on data rows — the row-navigation-only treegrid variant (matching Tree's own keyboard model), not full 2D cell navigation.
- Keyboard: `ArrowDown`/`ArrowUp` move, `ArrowRight` expands (or moves into the first child), `ArrowLeft` collapses (or moves to the parent), `Home`/`End` jump, `Enter`/`Space` toggles expansion on a branch row and (while `selectable`) toggles that row's checkbox.
- The header/row checkboxes are labeled native `<dg-checkbox>`s; no `aria-checked` on the `<tr role="row">` itself — unlike Tree's `role="treeitem"`, ARIA's treegrid `role="row"` has no `aria-checked` state, so the checkbox's own native semantics carry it.

## Design notes

**Hierarchy-aware filter.** A flat per-node filter (checking each node in
isolation) would hide a matching grandchild behind its now-excluded,
non-matching parent — useless for a search over a hierarchy. Instead, a
node that matches the query keeps its ENTIRE original subtree unpruned
(full context beneath a match stays visible, not re-filtered); a node
that doesn't match but has a matching descendant keeps only the
recursively-filtered children, dropping siblings that lead nowhere.
While a filter is active, every retained node renders expanded regardless
of `expandedIds` — so a match is never hidden behind a collapsed
ancestor — without ever writing to the `expandedIds` model itself;
clearing the filter restores whatever expand state `expandedIds` already
held.

**Pagination is over ROOT nodes, not the flattened visible-row list.**
Paginating the flattened list would make the page boundary shift every
time a row expands or collapses, since one root's visible descendant
count is unbounded and variable. Expanding/collapsing a root already on
the current page never changes which roots are on that page.

**Page-scoped select-all.** Once `pageSize` is set, "select all" (the
header checkbox) only checks/unchecks the CURRENT PAGE's roots — mirroring
`@dynamong/table`'s own page-scoped `toggleSelectAll`. Selections made on
other pages are preserved either way.

## Tier / dependencies

- `tier:3` — composes `@dynamong/spinner`/`@dynamong/checkbox` (`tier:0`) for its `loading` empty-state and row selection, `@dynamong/input-text` (`tier:0`) for the filter box, and `@dynamong/pagination` (`tier:2`) for the pagination footer. Sort/filter-shaped logic and the cascading-selection algorithm are all independently duplicated from `@dynamong/table`/`@dynamong/tree` rather than imported (Table's own sort/filter helpers aren't exported from its `index.ts` regardless, and TreeTable/Tree stay separate `tier:1`/`tier:3` libs rather than one depending on the other).

## Running unit tests

Run `nx test data-tree-table` to execute the unit tests.
