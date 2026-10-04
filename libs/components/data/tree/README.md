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

| Input                   | Type                                              | Default                 | Description                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`                 | `DynamoTreeNode[]` (required)                     | —                       |                                                                                                                                                                                                               |
| `expandedIds`           | `string[]` (model)                                | `[]`                    | Which node ids are currently expanded.                                                                                                                                                                        |
| `selected`              | `string[]` (model)                                | `[]`                    | In `'checkbox'` mode: every node id (leaf or branch) currently fully checked, cascading to enabled descendants. In `'single'`/`'multiple'` mode: the plain (non-cascading) selected id(s) — see Design notes. |
| `selectionMode`         | `'single' \| 'multiple' \| 'checkbox'`            | `'checkbox'`            | `'checkbox'` is the original always-cascading tri-state model, unchanged. `'single'`/`'multiple'` are new non-cascading modes — see Design notes.                                                             |
| `ariaLabel`             | `string \| undefined`                             | `undefined`             |                                                                                                                                                                                                               |
| `ariaDescribedby`       | `string \| undefined`                             | `undefined`             | Forwarded as `aria-describedby` on the `role="tree"` element.                                                                                                                                                 |
| `fluid`                 | `boolean`                                         | `true`                  | `true` renders the root wrapper `w-full`; `false` shrinks it to content width.                                                                                                                                |
| `emptyMessage`          | `string`                                          | `'No data'`             | Shown in place of the tree when `items` is empty.                                                                                                                                                             |
| `loading`               | `boolean`                                         | `false`                 | Renders a spinner + message in the empty-state slot and makes expand/collapse, checking, and row activation non-interactive.                                                                                  |
| `loadingMessage`        | `string`                                          | `'Loading…'`            | Shown in the empty-state slot instead of `emptyMessage` while `loading` is true.                                                                                                                              |
| `filterable`            | `boolean`                                         | `false`                 | Renders a search `<input>` above the tree. Matching is hierarchy-aware — see Design notes.                                                                                                                    |
| `filterPlaceholder`     | `string`                                          | `'Search...'`           |                                                                                                                                                                                                               |
| `filterText`            | `string` (model)                                  | `''`                    | Case-insensitive substring match against `label`.                                                                                                                                                             |
| `noMatchesMessage`      | `string`                                          | `'No matching results'` | Shown instead of `emptyMessage` when `items` has nodes but the active filter matched none.                                                                                                                    |
| `nodeTemplate`          | `TemplateRef<DynamoTreeNodeContext> \| undefined` | `undefined`             | Custom per-node content, replacing the default plain-`label` span — see Design notes.                                                                                                                         |
| `virtualScroll`         | `boolean`                                         | `false`                 | Virtualizes the flattened, expand-state-aware node list via `@dynamong/virtual-scroll` — see Design notes.                                                                                                    |
| `virtualScrollItemSize` | `number`                                          | `40`                    | Row height in px when virtualized.                                                                                                                                                                            |
| `virtualScrollHeight`   | `number`                                          | `400`                   | Viewport height in px when virtualized.                                                                                                                                                                       |

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

- `role="tree"` root (omitted entirely while `items` is empty, in favor of a `role="status"` empty-state region — a plain `<div>` isn't a valid child of `role="tree"`), `role="treeitem"` rows with `aria-expanded`/`aria-checked` (including `"mixed"` for a partially-checked branch, `'checkbox'` mode only)/`aria-selected` (`'single'`/`'multiple'` mode only — always `"false"` in `'checkbox'` mode, where selection is conveyed by `aria-checked` instead)/`aria-level`/`aria-posinset`/`aria-setsize`. `aria-multiselectable` on the root is `"false"` in `'single'` mode, `"true"` otherwise.
- Keyboard: `ArrowDown`/`ArrowUp` move, `ArrowRight` expands (or moves into the first child), `ArrowLeft` collapses (or moves to the parent), `Home`/`End` jump, `Enter`/`Space` toggles the active row's checkbox and activates it.
- The expand/collapse chevron is a real `<button>` with its own accessible name (e.g. "Expand Documents") — not just a clickable icon. It's excluded from the Tab sequence (`tabindex="-1"`) since the row itself is already the roving tab stop and `ArrowRight`/`ArrowLeft`/`Enter` already toggle expansion from there; the button exists so touch-AT (VoiceOver/TalkBack) and voice-control/switch-access users have a directly operable, named control at that location too.
- While `virtualScroll` is active, moving to a row outside the mounted range first scrolls the viewport to it (`scrollToIndex`), then focuses it once CDK has actually rendered it (a bounded `requestAnimationFrame` poll, not a single frame) — real DOM focus lands the same as the non-virtualized path, just after a short delay instead of synchronously.

## Passthrough (`pt`)

Every part below accepts a `pt` entry (merged class + arbitrary attributes), matching
`@dynamong/table`'s/`@dynamong/tree-table`'s own convention:

`root`, `filterWrapper`, `filterInput`, `emptyState`, `tree`, `row`, `chevronButton`, `chevron`,
`checkbox`, `label`, `group`.

`pt.checkbox` is forwarded into the nested `<dg-checkbox>`'s own `pt.root`; `pt.filterInput` is
forwarded into `<dg-input-text>`'s `pt.input`.

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

**`selectionMode`.** `'checkbox'` (default) is the original, always-cascading tri-state checkbox model,
byte-for-byte unchanged. `'single'`/`'multiple'` are new non-cascading modes (PrimeNG's own three
`p-tree` selection modes) that reuse the exact same `selected: string[]` model — only the write
semantics differ, so switching modes never changes the model's type. `'single'`: a click/Enter-Space
_replaces_ `selected` with just that node's id — clicking an already-selected node leaves it selected,
it never toggles off. `'multiple'`: a click/Enter-Space toggles plain membership — **a bare click, no
modifier key required.** This is a deliberate divergence from PrimeNG's own `p-tree` default
(`metaKeySelection: true`, where a plain click _replaces_ the selection and Ctrl/Cmd-click is what
toggles/adds) — no other component in this codebase has a modifier-key-click convention to be
consistent with, and a bare-click toggle matches every other multi-select interaction already here
(Table's row selection, MultiSelect's option toggling, Tree's own `'checkbox'` mode).

**Custom node templating.** `nodeTemplate` replaces the default plain-`label` rendering with
arbitrary projected content — pass an `<ng-template let-node let-depth="depth" let-expanded="expanded">`
and bind `[nodeTemplate]` to it. The context mirrors `DynamoTableCellContext`/`DynamoTreeTableCellContext`'s
own `$implicit`/explicit-name-alias shape; unlike those, there's no separate `row`/`data` field —
`DynamoTreeNode` already carries `label`/`value` directly. The template is forwarded through every
level of recursion automatically, so a deeply-nested child renders through it too.

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

**Virtual scroll.** `virtualScroll` virtualizes the already-flat, expand-state-aware node list (the
existing `visibleEntries()` computed, previously unused for rendering) via `@dynamong/virtual-scroll`.
`DynamoTreeItem` — Tree's genuinely recursive rendering primitive — is reused for both the recursive
and virtualized paths rather than duplicated: a `renderChildren` input (default `true`) gates only the
trailing nested-children block, so the virtualized path passes `[renderChildren]="false"` and lets
`visibleEntries()` itself supply every already-expanded descendant as its own flat entry. Losing the
nested-group expand/collapse height animation while virtualized is expected (hierarchy is still conveyed
via `aria-level`/`aria-posinset`/`aria-setsize`); dropping the wrapping `role="group"` for flattened rows
is ARIA-legal for the same reason. CDK's `_RecycleViewRepeaterStrategy` reuses `<dg-tree-item>` component
instances across scroll positions rather than destroying/recreating them, which breaks any construction-only,
one-shot logic that assumes an instance's identity never changes — this is why the row-focus registry was
removed in favor of a DOM scan (see `tree-state.ts`) and why the checkbox's `aria-label` re-syncs via
`ngOnChanges` instead of only `afterNextRender`.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@dynamong/checkbox`, `@dynamong/input-text`, `@dynamong/spinner`,
  `@dynamong/virtual-scroll`.

## Running unit tests

Run `nx test data-tree` to execute the unit tests.
