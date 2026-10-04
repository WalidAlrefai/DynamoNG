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

| Input                   | Type                                   | Default                 | Description                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodes`                 | `DynamoTreeNode<TValue>[]` (required)  | —                       |                                                                                                                                                                                                               |
| `placeholder`           | `string`                               | `'Select...'`           |                                                                                                                                                                                                               |
| `size`                  | `DynamoSize`                           | `'md'`                  |                                                                                                                                                                                                               |
| `invalid`               | `boolean`                              | `false`                 |                                                                                                                                                                                                               |
| `disabled`              | `boolean` (model)                      | `false`                 | Also driven by Angular forms.                                                                                                                                                                                 |
| `loading`               | `boolean`                              | `false`                 | Renders a small spinner in the trigger and makes the component fully non-interactive, like `disabled`.                                                                                                        |
| `ariaLabel`             | `string \| undefined`                  | `undefined`             |                                                                                                                                                                                                               |
| `ariaDescribedby`       | `string \| undefined`                  | `undefined`             | Forwarded as `aria-describedby` on the trigger.                                                                                                                                                               |
| `fluid`                 | `boolean`                              | `true`                  | `true` renders the trigger `w-full`; `false` shrinks it to content width.                                                                                                                                     |
| `expandedIds`           | `string[]` (model)                     | `[]`                    | Which branch node ids are currently expanded.                                                                                                                                                                 |
| `clearable`             | `boolean`                              | `false`                 | Shows a clear (×) button next to the trigger once a value is selected.                                                                                                                                        |
| `selectionMode`         | `'single' \| 'multiple' \| 'checkbox'` | `'single'`              | `'single'` is the original, only-ever behavior. `'multiple'`/`'checkbox'` are new — see Design notes.                                                                                                         |
| `value`                 | `TValue \| TValue[] \| null` (model)   | `null`                  | Also driven by Angular forms. A plain scalar in `'single'` mode; an array in `'multiple'`/`'checkbox'` mode. Can hold a branch's own value, not just a leaf's — clicking a branch row selects it.             |
| `virtualScroll`         | `boolean`                              | `false`                 | Renders the visible-entry list through `@dynamong/virtual-scroll`.                                                                                                                                            |
| `virtualScrollItemSize` | `number`                               | `36`                    |                                                                                                                                                                                                               |
| `virtualScrollHeight`   | `number`                               | `240`                   |                                                                                                                                                                                                               |
| `readOnly`              | `boolean`                              | `false`                 | HTML `readonly` semantics: the trigger stays focusable and the panel still opens for browsing/expanding, but committing a node is blocked. Unlike `disabled`, doesn't dim it or remove it from the tab order. |
| `filterable`            | `boolean`                              | `false`                 | Renders a search box above the tree. Branches with no matching label anywhere in their subtree are hidden entirely; a branch containing a match auto-reveals that descendant regardless of `expandedIds`.     |
| `filterText`            | `string` (model)                       | `''`                    | Reset to `''` whenever the panel closes.                                                                                                                                                                      |
| `filterPlaceholder`     | `string`                               | `'Search...'`           |                                                                                                                                                                                                               |
| `noResultsMessage`      | `string`                               | `'No matching options'` | Shown when `nodes()` is non-empty but the filter matched nothing.                                                                                                                                             |

## Outputs

| Output              | Payload                      | Fires when                                                                                                                                                                                   |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`       | `TValue \| TValue[] \| null` | `value` changes (auto-generated by `model()`).                                                                                                                                               |
| `expandedIdsChange` | `string[]`                   | `expandedIds` changes.                                                                                                                                                                       |
| `itemSelect`        | `DynamoTreeNode<TValue>`     | A node row is committed (click, or keyboard Enter/Space) — including branch rows, since selecting a branch itself is supported. Expanding a branch via its own chevron button does not emit. |

## Accessibility

- `role="combobox"` trigger; `role="tree"` panel with `role="treeitem"` rows. The panel's `role`/
  `aria-label`/`aria-multiselectable` are all omitted while showing only the no-results message — an
  empty `role="tree"` (zero `treeitem` children) is itself an `aria-required-children` violation
  regardless of what other, non-`treeitem` content it holds, so the container isn't a tree at all in
  that state; the message itself carries `role="status"` instead.
- `aria-multiselectable` is `"false"` in `'single'` mode, `"true"` in `'multiple'`/`'checkbox'` mode.
  `aria-checked` (`"true"`/`"false"`/`"mixed"`) is only set on rows in `'checkbox'` mode.
- Keyboard: `ArrowDown`/`ArrowUp` move, `ArrowRight` expands (or moves into a visible child), `ArrowLeft` collapses (or moves to the parent), `Home`/`End` jump, `Enter`/`Space` commits the active row, `Escape` closes.
- **Typeahead**: typing jumps to the first _visible_ node whose label starts with it, opening the panel if closed. Collapsed nodes' hidden children are unreachable, matching Arrow-key navigation. Repeating a letter cycles through matches; the buffer resets after ~500ms. Superseded by the filter box's own keydown handling while `filterable` is on.

## Design notes

**`selectionMode`.** `'single'` (default) is TreeSelect's original, only-ever behavior — `value` stays a
plain scalar, a pick replaces it and closes the panel. `'multiple'`/`'checkbox'` make `value` an array
instead (the same model widened, not a separate one — mirrors `DynamoDatePicker`'s own `Date | Date[] |
null` precedent) and leave the panel open across picks, so selecting several items in a row doesn't force
a reopen for the next one — the same posture `DynamoMultiSelect`'s own panel already takes. `'multiple'`
toggles plain membership with a bare click, no modifier key, no cascading. `'checkbox'` cascades
tri-state to enabled descendants — a local, value-keyed port of `DynamoTree`'s own cascading algorithm (a
branch's displayed state is always derived from its children, never stored directly; disabled
descendants are skipped on cascade and can leave an otherwise-checked branch permanently `'mixed'`, since
they can never themselves become checked). The checkbox itself is a purely decorative, `aria-hidden`
indicator rather than a real `<dg-checkbox>` — mirrors `DynamoSelect`'s own `selectedIndicator="checkbox"`
precedent, not `DynamoTree`'s: a row here is `tabindex="-1"` and non-interactive (all keyboard handling
lives on the trigger), so a second independently-focusable native checkbox nested inside it would be a
real a11y regression; the row's own `aria-checked` already conveys the state to assistive tech.

**`clearable`.** A direct port of `DynamoCascadeSelect`'s own `clearable` — shows an × button next to the
trigger once a value is selected (`hasSelection()`, true in any mode), resetting `value` to `null` in
`'single'` mode or `[]` in `'multiple'`/`'checkbox'` mode.

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/select`, `@dynamong/tree`, `@dynamong/spinner`, `@dynamong/virtual-scroll`, `@dynamong/input-text`, `@dynamong/icons`.

## Running unit tests

Run `nx test forms-tree-select` to execute the unit tests.
