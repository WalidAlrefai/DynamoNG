# @dynamong/order-list

A single reorderable list with drag-and-drop, ▲/▼ (and optional ⤒/⤓)
controls, full keyboard navigation, an optional filter box, and optional
virtual scrolling for large lists — the one-panel counterpart to
`DynamoPicklist`.

## Usage

```html
<dg-order-list
  [(value)]="items"
  [selectable]="true"
  listLabel="Playlist"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected onItemSelect(option: DynamoSelectOption<string>): void { ... }
```

## Inputs

| Input                   | Type                                   | Default               | Description                                                                                                                                                                               |
| ----------------------- | -------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                 | `DynamoSelectOption<TValue>[]` (model) | `[]`                  | Two-way bindable, ordered list.                                                                                                                                                           |
| `listLabel`             | `string`                               | `'Items'`             | Header text above the list.                                                                                                                                                               |
| `size`                  | `DynamoOrderListSize`                  | `'md'`                |                                                                                                                                                                                           |
| `disabled`              | `boolean`                              | `false`               | Disables reordering (drag, ▲/▼/⤒/⤓) and selection.                                                                                                                                        |
| `readOnly`              | `boolean`                              | `false`               | HTML `readonly` semantics: rows stay visible/focusable/navigable, but reordering and selection are both blocked. Unlike `disabled`, doesn't dim the list or remove it from the tab order. |
| `selectable`            | `boolean`                              | `false`               | Renders a checkbox on each row and makes click/Enter/Space toggle multi-selection.                                                                                                        |
| `dragdrop`              | `boolean`                              | `true`                | Allows CDK drag reordering.                                                                                                                                                               |
| `moveTopBottom`         | `boolean`                              | `true`                | Also renders "move to top" / "move to bottom" buttons.                                                                                                                                    |
| `filterable`            | `boolean`                              | `false`               | Shows a search box above the list that narrows rows by label. Disables drag-and-drop while a query is active — see Design notes.                                                          |
| `filterText`            | `string` (model)                       | `''`                  | Two-way bindable filter query.                                                                                                                                                            |
| `filterPlaceholder`     | `string`                               | `'Search...'`         |                                                                                                                                                                                           |
| `noResultsMessage`      | `string`                               | `'No matching items'` | Shown when `value` is non-empty but the filter matched nothing.                                                                                                                           |
| `virtualScroll`         | `boolean`                              | `false`               | Renders the option list through `@dynamong/virtual-scroll`, for large `value` arrays. Disables drag-and-drop while enabled — see Design notes.                                            |
| `virtualScrollItemSize` | `number`                               | `36`                  |                                                                                                                                                                                           |
| `virtualScrollHeight`   | `number`                               | `320`                 |                                                                                                                                                                                           |

## Outputs

| Output        | Payload                        | Fires when                                                                                                                |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `valueChange` | `DynamoSelectOption<TValue>[]` | `value` changes (auto-generated by `model()`) — reordering (drag, ▲/▼, top/bottom) as well as programmatic changes.       |
| `itemSelect`  | `DynamoSelectOption<TValue>`   | A user directly toggles a row's checkbox (click or Enter/Space) while `selectable` is `true`. Not emitted for reordering. |

## Accessibility

- Rows are a keyboard-navigable list with an active row highlight; ▲/▼/⤒/⤓ buttons expose reordering to non-drag users.
- Keyboard: `ArrowDown`/`ArrowUp` move the active row, `Home`/`End` jump to the first/last enabled row, `Enter`/`Space` toggles the active row's checkbox when `selectable` is `true`. When `filterable` is on, the same `ArrowDown`/`ArrowUp` also work from inside the filter box, and `Escape` there clears the query.
- The no-results row is a `role="option"` with `aria-disabled="true"` (not `role="presentation"`) — a `role="listbox"` requires at least one option-role child, so an inert "no results" row still needs to satisfy that structural requirement.

## Design notes

**Both `filterable` and `virtualScroll` disable drag-and-drop while
active, not just as a v1 gap.** `CdkDropList` computes
`previousIndex`/`currentIndex` from whatever's currently rendered —
either the mounted-DOM subset (virtualized) or the filtered subset
(filtering) — not the full-array positions `onDropped()` assumes.
Rather than risk a silently-wrong reorder, drag is disabled outright
whenever either is active. The always-visible ▲/▼/⤒/⤓ buttons and
keyboard reorder are unaffected — both operate on the full array
directly, never on CDK's mounted-DOM index tracking or the filtered
view — so every operation stays available, just not via drag.

**Reordering across a hidden neighbor is data-correct but can look like
a no-op.** While filtered, a single-step ▲/▼ move still repositions the
active item by exactly one position in the _full_ array — if that
neighbor happens to be filtered out, the item's position relative to
other _visible_ rows doesn't change (filtering preserves relative
order), so the move can appear to do nothing. This is intentional and
harmless — clearing the filter (or moving again) reveals the real
effect — rather than adding "skip to the nearest visible neighbor"
logic.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@angular/cdk` (drag-drop), `@angular/forms`, `@dynamong/icons`, `@dynamong/virtual-scroll`, `@dynamong/input-text`.

## Running unit tests

Run `nx test forms-order-list` to execute the unit tests.
