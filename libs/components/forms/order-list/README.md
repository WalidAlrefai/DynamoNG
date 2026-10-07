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
| `ariaDescribedby`       | `string \| undefined`                  | `undefined`           | Forwarded as `aria-describedby` on the listbox.                                                                                                                                           |
| `fluid`                 | `boolean`                              | `true`                | `true` renders the list `w-full`; `false` keeps it at its original fixed card width (`w-72`).                                                                                             |
| `selectable`            | `boolean`                              | `false`               | Renders a checkbox on each row and makes click/Enter/Space toggle multi-selection.                                                                                                        |
| `dragdrop`              | `boolean`                              | `true`                | Allows CDK drag reordering.                                                                                                                                                               |
| `moveTopBottom`         | `boolean`                              | `true`                | Also renders "move to top" / "move to bottom" buttons.                                                                                                                                    |
| `showReorderControls`   | `boolean`                              | `true`                | Shows/hides the entire ▲/▼ (and ⤒/⤓) controls row.                                                                                                                                        |
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

- Rows are a keyboard-navigable list with an active row highlight; ▲/▼/⤒/⤓ buttons expose reordering to non-drag users. The listbox carries `aria-disabled="true"` while `disabled` is set (distinct from `aria-readonly`, which reflects `readOnly`), and forwards `ariaDescribedby` to `aria-describedby`.
- Keyboard: `ArrowDown`/`ArrowUp` move the active row, `Home`/`End` jump to the first/last enabled row, `Enter`/`Space` toggles the active row's checkbox when `selectable` is `true`. When `filterable` is on, the same `ArrowDown`/`ArrowUp` also work from inside the filter box, and `Escape` there clears the query. The filter box is genuinely disabled (not just visually) while `disabled`/`readOnly`.
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

**`canMoveUp`/`canMoveDown` and `aria-multiselectable` needed no fix in
this round, unlike `DynamoPicklist`'s own.** OrderList's reorder-button
gating already correctly `computed()`s off both `disabled()` and
`readOnly()` directly, and `aria-multiselectable` is correctly
conditional on `selectable()` (its checkboxes are genuinely optional,
unlike Picklist's always-on ones) — both were confirmed correct by
direct code reading and locked in with regression tests, not changed.

**The filter box switched from `[ngModel]` to a plain `[value]`/
`(valueChange)` binding, same root cause as `DynamoPicklist`'s own
fix.** Adding a `[disabled]` binding to a `[ngModel]`-bound
`<dg-input-text>` silently loses a race against `NgModel`'s own
`setDisabledState()` call on the same underlying signal — see
`@dynamong/picklist`'s own README for the full mechanism. Fixed the
same way: bypass the CVA/`NgModel` layer entirely, since this filter
box has no real reactive-forms integration need.

**`fluid` defaults to `true`, changing the list's default width from a
fixed `w-72` card to a full-width one.** Confirmed low blast radius
before changing the default: `<dg-order-list>` has exactly one
consumer in this repo (its own docs page), unlike `DynamoInputText`'s
32-usage case from an earlier round. Pass `fluid={false}` to keep the
original fixed-width card appearance.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@angular/cdk` (drag-drop), `@dynamong/icons`, `@dynamong/virtual-scroll`, `@dynamong/input-text`.

## Running unit tests

Run `nx test forms-order-list` to execute the unit tests.
