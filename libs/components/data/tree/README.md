# @dynamong/tree

A hierarchical tree with expand/collapse, cascading checkbox selection,
and full keyboard navigation.

## Usage

```html
<dg-tree
  [items]="items"
  [(expandedIds)]="expanded"
  [(selected)]="checkedIds"
  [loading]="isFetching()"
  ariaLabel="Files"
  (nodeActivate)="onActivate($event)"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected onItemSelect(node: DynamoTreeNode): void { ... }
```

## Node shape

| Field      | Type                  | Description                                                                                                                                |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`       | `string`              |                                                                                                                                            |
| `label`    | `string`              |                                                                                                                                            |
| `value`    | `TValue \| undefined` |                                                                                                                                            |
| `children` | `DynamoTreeNode[]`    | Omitted/empty makes a node a leaf — unless `leaf: false` marks it as a branch with children not yet fetched (see Lazy loading).            |
| `disabled` | `boolean`             |                                                                                                                                            |
| `leaf`     | `boolean`             | Set to `false` to render a chevron on a node with no `children` yet — pairs with `(nodeExpand)`. Omitted/`true` behaves exactly as before. |
| `loading`  | `boolean`             | Shows a spinner in place of this node's chevron and makes it non-interactive — entirely consumer-driven; the tree never sets it itself.    |

## Inputs

| Input               | Type                          | Default                 | Description                                                                                                                  |
| ------------------- | ----------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `items`             | `DynamoTreeNode[]` (required) | —                       |                                                                                                                              |
| `expandedIds`       | `string[]` (model)            | `[]`                    | Which node ids are currently expanded.                                                                                       |
| `selected`          | `string[]` (model)            | `[]`                    | Every node id (leaf or branch) currently fully checked. Checking a branch cascades to its enabled descendants.               |
| `ariaLabel`         | `string \| undefined`         | `undefined`             |                                                                                                                              |
| `emptyMessage`      | `string`                      | `'No data'`             | Shown in place of the tree when `items` is empty.                                                                            |
| `loading`           | `boolean`                     | `false`                 | Renders a spinner + message in the empty-state slot and makes expand/collapse, checking, and row activation non-interactive. |
| `loadingMessage`    | `string`                      | `'Loading…'`            | Shown in the empty-state slot instead of `emptyMessage` while `loading` is true.                                             |
| `filterable`        | `boolean`                     | `false`                 | Renders a search `<input>` above the tree. Matching is hierarchy-aware — see Design notes.                                   |
| `filterPlaceholder` | `string`                      | `'Search...'`           |                                                                                                                              |
| `filterText`        | `string` (model)              | `''`                    | Case-insensitive substring match against `label`.                                                                            |
| `noMatchesMessage`  | `string`                      | `'No matching results'` | Shown instead of `emptyMessage` when `items` has nodes but the active filter matched none.                                   |

## Outputs

| Output              | Payload          | Fires when                                                                                                                                                                                                               |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `expandedIdsChange` | `string[]`       | `expandedIds` changes (auto-generated by `model()`).                                                                                                                                                                     |
| `selectedChange`    | `string[]`       | `selected` changes.                                                                                                                                                                                                      |
| `nodeActivate`      | `DynamoTreeNode` | Enter/Space or a row click — independent of checkbox toggling. Note Enter on an enabled leaf both activates AND checks it, so `nodeActivate` and `itemSelect` fire together in that case.                                |
| `itemSelect`        | `DynamoTreeNode` | A node's checked membership changes, with the full _directly-interacted_ node — fires once even when the interaction cascades to check/uncheck many descendants at once.                                                 |
| `nodeExpand`        | `DynamoTreeNode` | A node is expanded (click, Enter/Space, or `ArrowRight`) and it's expandable (`leaf: false` or has `children`) but has no `children` loaded yet — see Lazy loading. Never fires again for a node once it has `children`. |
| `filterTextChange`  | `string`         | `filterText` changes (auto-generated by `model()`).                                                                                                                                                                      |

## Accessibility

- `role="tree"` root (omitted entirely while `items` is empty, in favor of a `role="status"` empty-state region — a plain `<div>` isn't a valid child of `role="tree"`), `role="treeitem"` rows with `aria-expanded`/`aria-checked` (including `"mixed"` for a partially-checked branch)/`aria-level`/`aria-posinset`/`aria-setsize`.
- Keyboard: `ArrowDown`/`ArrowUp` move, `ArrowRight` expands (or moves into the first child), `ArrowLeft` collapses (or moves to the parent), `Home`/`End` jump, `Enter`/`Space` toggles the active row's checkbox and activates it.

## Design notes

**Lazy loading.** Mark a node `leaf: false` with no `children` to render
it as an unresolved branch. Expanding it (click, Enter/Space, or
`ArrowRight`) fires `(nodeExpand)` with the full node — the tree itself
never fetches or awaits anything, it stays fully synchronous. The
consumer's own handler typically sets that node's `loading: true` (shows
a spinner in place of the chevron and makes it non-interactive while
true), fetches the real children, then replaces the node in their own
`items()` array with `children` populated and `loading` cleared — the
same reference-replacement pattern every other model-bound list in this
codebase already uses. `nodeExpand` never fires again for that node once
it has `children`, so a fetch only ever happens once per node unless the
consumer clears `children` back out themselves. This mirrors
`DynamoAutocomplete`'s own `lazy`/`searchQuery` idiom: a plain output
carrying a lightweight payload, with the consumer patching resolved data
back in through a normal input/model rather than the component taking an
async loader function.

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

## Tier / dependencies

- `tier:1`. Peer dependencies: `@dynamong/checkbox`, `@dynamong/input-text`, `@dynamong/spinner`.

## Running unit tests

Run `nx test data-tree` to execute the unit tests.
