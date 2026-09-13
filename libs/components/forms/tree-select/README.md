# @dynamong/tree-select

A dropdown for selecting a node (branch or leaf) from a tree, rendered
inline inside a single panel with expand/collapse chevrons — unlike
`@dynamong/cascade-select`'s sibling-flyout drill-down.

## Usage

```html
<dg-tree-select
  [nodes]="categories"
  [(value)]="selectedId"
  [(expandedIds)]="expanded"
  [loading]="isSaving()"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected onItemSelect(node: DynamoTreeNode<string>): void { ... }
```

## Inputs

| Input                   | Type                                  | Default                 | Description                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodes`                 | `DynamoTreeNode<TValue>[]` (required) | —                       |                                                                                                                                                                                                               |
| `placeholder`           | `string`                              | `'Select...'`           |                                                                                                                                                                                                               |
| `size`                  | `DynamoSize`                          | `'md'`                  |                                                                                                                                                                                                               |
| `invalid`               | `boolean`                             | `false`                 |                                                                                                                                                                                                               |
| `disabled`              | `boolean` (model)                     | `false`                 | Also driven by Angular forms.                                                                                                                                                                                 |
| `loading`               | `boolean`                             | `false`                 | Renders a small spinner in the trigger and makes the component fully non-interactive, like `disabled`.                                                                                                        |
| `ariaLabel`             | `string \| undefined`                 | `undefined`             |                                                                                                                                                                                                               |
| `expandedIds`           | `string[]` (model)                    | `[]`                    | Which branch node ids are currently expanded.                                                                                                                                                                 |
| `value`                 | `TValue \| null` (model)              | `null`                  | Also driven by Angular forms. Can hold a branch's own value, not just a leaf's — clicking a branch row selects it.                                                                                            |
| `virtualScroll`         | `boolean`                             | `false`                 | Renders the visible-entry list through `@dynamong/virtual-scroll`.                                                                                                                                            |
| `virtualScrollItemSize` | `number`                              | `36`                    |                                                                                                                                                                                                               |
| `virtualScrollHeight`   | `number`                              | `240`                   |                                                                                                                                                                                                               |
| `readOnly`              | `boolean`                             | `false`                 | HTML `readonly` semantics: the trigger stays focusable and the panel still opens for browsing/expanding, but committing a node is blocked. Unlike `disabled`, doesn't dim it or remove it from the tab order. |
| `filterable`            | `boolean`                             | `false`                 | Renders a search box above the tree. Branches with no matching label anywhere in their subtree are hidden entirely; a branch containing a match auto-reveals that descendant regardless of `expandedIds`.     |
| `filterText`            | `string` (model)                      | `''`                    | Reset to `''` whenever the panel closes.                                                                                                                                                                      |
| `filterPlaceholder`     | `string`                              | `'Search...'`           |                                                                                                                                                                                                               |
| `noResultsMessage`      | `string`                              | `'No matching options'` | Shown when `nodes()` is non-empty but the filter matched nothing.                                                                                                                                             |

## Outputs

| Output              | Payload                  | Fires when                                                                                                                                                                                   |
| ------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`       | `TValue \| null`         | `value` changes (auto-generated by `model()`).                                                                                                                                               |
| `expandedIdsChange` | `string[]`               | `expandedIds` changes.                                                                                                                                                                       |
| `itemSelect`        | `DynamoTreeNode<TValue>` | A node row is committed (click, or keyboard Enter/Space) — including branch rows, since selecting a branch itself is supported. Expanding a branch via its own chevron button does not emit. |

## Accessibility

- `role="combobox"` trigger; `role="tree"` panel with `role="treeitem"` rows.
- Keyboard: `ArrowDown`/`ArrowUp` move, `ArrowRight` expands (or moves into a visible child), `ArrowLeft` collapses (or moves to the parent), `Home`/`End` jump, `Enter`/`Space` commits the active row, `Escape` closes.
- **Typeahead**: typing jumps to the first _visible_ node whose label starts with it, opening the panel if closed. Collapsed nodes' hidden children are unreachable, matching Arrow-key navigation. Repeating a letter cycles through matches; the buffer resets after ~500ms. Superseded by the filter box's own keydown handling while `filterable` is on.

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/select`, `@dynamong/tree`, `@dynamong/spinner`, `@dynamong/virtual-scroll`, `@dynamong/input-text`.

## Running unit tests

Run `nx test forms-tree-select` to execute the unit tests.
