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

| Input                   | Type                                       | Default              | Description                                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`                 | `DynamoTreeTableNode<TRow>[]` (required)   | —                    | Each node wraps the row's `data` plus recursive `children`.                                                                                                                                                                                                            |
| `columns`               | `DynamoTreeTableColumn<TRow>[]` (required) | —                    |                                                                                                                                                                                                                                                                        |
| `expandedIds`           | `string[]` (model)                         | `[]`                 |                                                                                                                                                                                                                                                                        |
| `ariaLabel`             | `string \| undefined`                      | `undefined`          |                                                                                                                                                                                                                                                                        |
| `ariaDescribedby`       | `string \| undefined`                      | `undefined`          | Forwarded as `aria-describedby` on the `<table>` element.                                                                                                                                                                                                              |
| `fluid`                 | `boolean`                                  | `true`               | `true` renders the root wrapper `w-full`; `false` shrinks it to content width.                                                                                                                                                                                         |
| `emptyMessage`          | `string`                                   | `'No data'`          |                                                                                                                                                                                                                                                                        |
| `loading`               | `boolean`                                  | `false`              | Renders a spinner + message in the empty-state slot and makes sorting, expand/collapse, selection, and row navigation non-interactive.                                                                                                                                 |
| `loadingMessage`        | `string`                                   | `'Loading…'`         | Shown in the empty-state slot instead of `emptyMessage` while `loading` is true.                                                                                                                                                                                       |
| `selectable`            | `boolean`                                  | `false`              | Opt-in row selection. Unset renders no selection column.                                                                                                                                                                                                               |
| `selected`              | `string[]` (model)                         | `[]`                 | Every node id (leaf or branch) currently fully checked — same id-keyed shape as `expandedIds`. Checking a branch cascades to its enabled descendants, mirroring `@dynamong/tree`'s own selection model (not Table's flat one — the natural fit for hierarchical data). |
| `filterable`            | `boolean`                                  | `false`              | Renders a search `<input>` above the table. Matching is hierarchy-aware — see Design notes.                                                                                                                                                                            |
| `filterPlaceholder`     | `string`                                   | `'Search...'`        |                                                                                                                                                                                                                                                                        |
| `filterText`            | `string` (model)                           | `''`                 | Case-insensitive substring match against every `filterable !== false` column.                                                                                                                                                                                          |
| `noMatchesMessage`      | `string`                                   | `'No matching rows'` | Shown instead of `emptyMessage` when `items` has nodes but the active filter matched none.                                                                                                                                                                             |
| `columnFilters`         | `Record<string, unknown>` (model)          | `{}`                 | Per-column filter values, keyed by `column.field`. Composes with `filterText` as a logical AND — see Design notes.                                                                                                                                                     |
| `pageSize`              | `number \| undefined` (model)              | `undefined`          | Opt-in pagination over ROOT nodes only — see Design notes.                                                                                                                                                                                                             |
| `pageSizeOptions`       | `number[]`                                 | `[10, 25, 50, 100]`  |                                                                                                                                                                                                                                                                        |
| `page`                  | `number` (model)                           | `1`                  | 1-indexed root-node page.                                                                                                                                                                                                                                              |
| `virtualScroll`         | `boolean`                                  | `false`              | Virtualizes `visibleEntries()` via `@dynamong/virtual-scroll` — see Design notes for how it composes with `pageSize` and expand/collapse.                                                                                                                              |
| `virtualScrollItemSize` | `number`                                   | `40`                 | Row height in px when virtualized.                                                                                                                                                                                                                                     |
| `virtualScrollHeight`   | `number`                                   | `400`                | Viewport height in px when virtualized.                                                                                                                                                                                                                                |
| `lazy`                  | `boolean`                                  | `false`              | Opt-in top-level/server-driven mode — see Design notes.                                                                                                                                                                                                                |
| `totalRecords`          | `number \| undefined`                      | `undefined`          | Server-reported root count while `lazy`. Falls back to `items().length` (dev-warned) when omitted.                                                                                                                                                                     |

## Outputs

| Output                | Payload                        | Fires when                                                                                                                       |
| --------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `expandedIdsChange`   | `string[]`                     | `expandedIds` changes (auto-generated by `model()`).                                                                             |
| `selectedChange`      | `string[]`                     | `selected` changes.                                                                                                              |
| `itemSelect`          | `DynamoTreeTableNode<TRow>`    | A user directly checks/unchecks a single node — not from the header "select all" checkbox, and not once per cascaded descendant. |
| `filterTextChange`    | `string`                       | `filterText` changes (auto-generated by `model()`).                                                                              |
| `columnFiltersChange` | `Record<string, unknown>`      | `columnFilters` changes (auto-generated by `model()`).                                                                           |
| `pageSizeChange`      | `number \| undefined`          | `pageSize` changes (auto-generated by `model()`).                                                                                |
| `pageChange`          | `number`                       | `page` changes (auto-generated by `model()`).                                                                                    |
| `lazyLoad`            | `DynamoTreeTableLazyLoadEvent` | A page/sort/filter/column-filter-driven UI interaction while `lazy` is `true` — see Design notes.                                |
| `nodeExpand`          | `DynamoTreeTableNode<TRow>`    | A node flagged `leaf: false` with no loaded `children` is expanded — see Design notes.                                           |

## Accessibility

- `role="treegrid"` root, `role="row"` on every `<tr>` (header included), `role="gridcell"` on every `<td>`, with `aria-level`/`aria-expanded` on data rows — the row-navigation-only treegrid variant (matching Tree's own keyboard model), not full 2D cell navigation.
- Keyboard: `ArrowDown`/`ArrowUp` move, `ArrowRight` expands (or moves into the first child), `ArrowLeft` collapses (or moves to the parent), `Home`/`End` jump, `Enter`/`Space` toggles expansion on a branch row and (while `selectable`) toggles that row's checkbox.
- The header/row checkboxes are labeled native `<dg-checkbox>`s; no `aria-checked` on the `<tr role="row">` itself — unlike Tree's `role="treeitem"`, ARIA's treegrid `role="row"` has no `aria-checked` state, so the checkbox's own native semantics carry it.
- The expand/collapse chevron is a real `<button>` with its own accessible name (e.g. "Expand resume.pdf") — not just a clickable icon. It's excluded from the Tab sequence (`tabindex="-1"`) since the row itself is already the roving tab stop and `ArrowRight`/`ArrowLeft`/`Enter` already toggle expansion from there; the button exists so touch-AT (VoiceOver/TalkBack) and voice-control/switch-access users have a directly operable, named control at that location too.
- Every sortable column header carries an explicit `aria-sort="none"` when it isn't the active sort key (not simply absent) — so assistive tech can distinguish "sortable, not currently sorted" from "not sortable at all," which correctly has no `aria-sort` attribute.

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

**Per-column filtering.** `DynamoTreeTableColumn.columnFilter` opts a column into a second header
row (built-in `<dg-input-text type="search">`, or `column.filterTemplate` when
`columnFilter.type === 'custom'`). It composes with `filterText` as a logical AND — but NOT by running
`filterTree` twice in sequence the way two independent flat filters could. `filterTree`'s
hierarchy-preservation (a match keeps its whole subtree) means a second sequential pass can't
distinguish "this node survived because it genuinely matched" from "this node survived only as a kept
match's ancestor" — which can let a row through that satisfies neither filter on its own. Global and
per-column filtering are instead combined into ONE predicate and the tree is pruned in a SINGLE pass.
See `tree-table.filter.ts`'s own doc comment for a worked example.

**Page-scoped select-all.** Once `pageSize` is set, "select all" (the
header checkbox) only checks/unchecks the CURRENT PAGE's roots — mirroring
`@dynamong/table`'s own page-scoped `toggleSelectAll`. Selections made on
other pages are preserved either way. The checkbox's `disabled` state is
scoped to the same current-page root set its `checked`/`indeterminate`
state already reads (`pagedRoots()`), not the raw `items()` — otherwise a
zero-match filter/page could leave the checkbox enabled-but-inert.

**Virtual scroll.** Virtualizes `visibleEntries()` (the already flat, expand-state-aware row list) via
`@dynamong/virtual-scroll`. Two deliberate divergences from Table's own `virtualScroll` exclusions:
`pageSize` composes freely (TreeTable's `pageSize` caps only the ROOT count, not the flattened row
count a single expanded root can still produce — unlike Table's `pageSize`, which already caps the
total render count, making virtualizing it pointless), and expand/collapse is fully supported
(TreeTable's expand/collapse IS the core feature, not an optional add-on row). The roving-tabindex
keyboard model (`ArrowUp`/`ArrowDown`/`Home`/`End`) still works while virtualized: when a keyboard move
targets a row that isn't currently mounted, the viewport is scrolled to it first, then focused once CDK
mounts it.

**Lazy / server-driven mode — two independent, orthogonal mechanisms.**

_Top-level lazy_ (`lazy`/`totalRecords`/`lazyLoad`) mirrors Table's own `lazy` mode exactly:
`filteredItems()`/`pagedRoots()` both bypass to `items()` verbatim (the consumer is expected to hand
back exactly the current page's own already-filtered-and-sorted root nodes), and a single
`DynamoTreeTableLazyLoadEvent` fires on every sort/filter/column-filter/page/pageSize-driven UI
interaction. One shape deviation from Table's own `DynamoTableLazyLoadEvent`: `sort` is a single
nullable descriptor, not an array — TreeTable never got multi-column sort. A consequence worth calling
out: while `lazy`, the filter-match "force everything expanded" behavior documented above is
suppressed — nothing was actually pruned server-side as far as TreeTable's own code can tell, so there
is nothing for a force-expand to be revealing; `expandedIds` alone governs visibility, same as the
unfiltered case. Unlike Table, there's no `trackBy` input and no accompanying warning for
`lazy`+`selectable`/`expansionTemplate` without one — TreeTable's row identity is always `node.id` (a
stable, consumer-supplied string), never object-reference equality, so a re-fetch returning new node
objects with the same ids never desyncs `selected`/`expandedIds`. `lazy` + `virtualScroll` is also
supported outright with no warning, unlike Table's analogous (genuinely ineffective) combination — see
`virtualScroll`'s own note above for why.

_Per-node lazy_ (`DynamoTreeTableNode.leaf`/`nodeExpand`) is independent of the above and has no Table
equivalent — it mirrors PrimeNG's own `p-tree`/`p-treeTable` lazy pattern instead. A node flagged
`leaf: false` with no `children` yet renders a chevron speculatively; expanding it for the first time
emits `nodeExpand` with the full node instead of just toggling `expandedIds` locally, and shows a
spinner in place of the chevron icon until the consumer writes real `children` back (and/or flips
`leaf` to `true` if the node turns out to be genuinely empty). No internal request de-duplication:
collapsing and re-expanding before an earlier fetch resolves re-emits `nodeExpand` again — a consumer
wanting to avoid duplicate fetches memoizes by `node.id` themselves.

_The two compose freely._ Toggling `lazy` never forces nodes unloaded and never touches `leaf`; `leaf`
on any given node is independent of root-paging state entirely. A small, fully-known root list
(`lazy` off) with deeply lazy subtrees (`leaf: false` sprinkled through `children`) and paginated roots
(`lazy` on) with fully-loaded children are both equally supported, together or separately.

## Passthrough (`pt`)

Every part below accepts a `pt` entry (merged class + arbitrary attributes),
matching `@dynamong/table`'s own convention:

`root`, `filterWrapper`, `filterInput`, `table`, `headerRow`, `headerCell`,
`sortButton`, `sortIcon`, `row`, `cell`, `selectionCell`, `selectionCheckbox`,
`chevronButton`, `chevron`, `columnFilterRow`, `columnFilterCell`,
`columnFilterInput`, `paginationWrapper`, `pagination`.

`pt.selectionCheckbox` and `pt.pagination` are forwarded into the nested
`<dg-checkbox>`/`<dg-pagination>`'s own `pt` input; `pt.filterInput` is
forwarded into `<dg-input-text>`'s `pt.input`. `@dynamong/pagination` itself
hasn't had its own `pt` passthrough wired yet (confirmed zero `ptFor`/`dgPt`
usage in its package) — TreeTable's forwarding is correct and complete, the
forwarded class just doesn't reach the rendered `<nav>` until Pagination's
own round wires it up.

## Tier / dependencies

- `tier:3` — composes `@dynamong/spinner`/`@dynamong/checkbox` (`tier:0`) for its `loading` empty-state and row selection, `@dynamong/input-text` (`tier:0`) for the filter box, and `@dynamong/pagination` (`tier:2`) for the pagination footer. Sort/filter-shaped logic and the cascading-selection algorithm are all independently duplicated from `@dynamong/table`/`@dynamong/tree` rather than imported (Table's own sort/filter helpers aren't exported from its `index.ts` regardless, and TreeTable/Tree stay separate `tier:1`/`tier:3` libs rather than one depending on the other).

## Running unit tests

Run `nx test data-tree-table` to execute the unit tests.
