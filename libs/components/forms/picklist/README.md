# @dynamong/picklist

A dual-listbox for moving items between two lists — "available" and
"selected" — via checkboxes, drag-and-drop, or move-all/move-selected
buttons. The classic transfer-list pattern for building an unordered
multi-select out of a large option set.

## Usage

```html
<dg-picklist
  [(source)]="available"
  [(target)]="selected"
  sourceLabel="Available"
  targetLabel="Selected"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected onItemSelect(event: DynamoPicklistItemSelectEvent<string>): void { ... }
```

## Inputs

| Input                      | Type                                   | Default                 | Description                                                                                                                                                                                                            |
| -------------------------- | -------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source`                   | `DynamoSelectOption<TValue>[]` (model) | `[]`                    | Two-way bindable. Options currently in the left/available panel.                                                                                                                                                       |
| `target`                   | `DynamoSelectOption<TValue>[]` (model) | `[]`                    | Two-way bindable. Options currently in the right/selected panel.                                                                                                                                                       |
| `size`                     | `DynamoPicklistSize`                   | `'md'`                  |                                                                                                                                                                                                                        |
| `disabled`                 | `boolean`                              | `false`                 | Disables checkbox toggling, drag-and-drop, move buttons, and keyboard reorder.                                                                                                                                         |
| `readOnly`                 | `boolean`                              | `false`                 | HTML `readonly` semantics: rows stay visible/focusable/navigable, but moving items (drag, arrows, buttons) and selection are all blocked. Unlike `disabled`, doesn't dim either panel or remove it from the tab order. |
| `sourceLabel`              | `string`                               | `'Available'`           | Left panel heading; also used to build move/reorder button `aria-label`s.                                                                                                                                              |
| `targetLabel`              | `string`                               | `'Selected'`            | Right panel heading; also used to build move/reorder button `aria-label`s.                                                                                                                                             |
| `ariaDescribedby`          | `string \| undefined`                  | `undefined`             | Forwarded as `aria-describedby` on both panels' listboxes.                                                                                                                                                             |
| `fluid`                    | `boolean`                              | `true`                  | `true` renders the root `w-full`; `false` shrinks it to content width.                                                                                                                                                 |
| `showSourceReorderButtons` | `boolean`                              | `true`                  | Independently shows/hides the source panel's own ▲/▼ reorder-button row.                                                                                                                                               |
| `showTargetReorderButtons` | `boolean`                              | `true`                  | Independently shows/hides the target panel's own ▲/▼ reorder-button row.                                                                                                                                               |
| `filterable`               | `boolean`                              | `false`                 | Shows a search box above each panel that narrows that panel's rows by label. Disables drag-and-drop on a panel while its own query is active — see Design notes.                                                       |
| `sourceFilterText`         | `string` (model)                       | `''`                    | Two-way bindable filter query for the source panel.                                                                                                                                                                    |
| `targetFilterText`         | `string` (model)                       | `''`                    | Two-way bindable filter query for the target panel.                                                                                                                                                                    |
| `filterPlaceholder`        | `string`                               | `'Search...'`           | Shared placeholder for both panels' filter boxes.                                                                                                                                                                      |
| `noResultsMessage`         | `string`                               | `'No matching options'` | Shown when a panel is non-empty but its filter matched nothing.                                                                                                                                                        |
| `virtualScroll`            | `boolean`                              | `false`                 | Renders each panel's option list through `@dynamong/virtual-scroll`, for large `source`/`target` arrays. Disables drag-and-drop on both panels while enabled — see Design notes.                                       |
| `virtualScrollItemSize`    | `number`                               | `36`                    |                                                                                                                                                                                                                        |
| `virtualScrollHeight`      | `number`                               | `320`                   |                                                                                                                                                                                                                        |

## Outputs

| Output         | Payload                                                      | Fires when                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceChange` | `DynamoSelectOption<TValue>[]`                               | `source` changes (auto-generated by `model()`) — moves, drags, and keyboard reorders all flow through this.                                                                  |
| `targetChange` | `DynamoSelectOption<TValue>[]`                               | `target` changes (auto-generated by `model()`).                                                                                                                              |
| `itemSelect`   | `DynamoPicklistItemSelectEvent<TValue>` (`{ option, side }`) | A user directly checks/unchecks one option (click or Enter/Space) — tagged with which panel (`'source'` or `'target'`) it lives in. Not fired for moves, drags, or reorders. |

## Accessibility

- Each panel is a `role="listbox"` with `aria-multiselectable="true"` (checkboxes are always present, unlike `DynamoOrderList`'s own conditional version) and `role="option"` rows (`aria-selected`, `aria-disabled`). Both listboxes also carry `aria-disabled="true"` while `disabled` is set, and forward `ariaDescribedby` to `aria-describedby`. Move and reorder buttons carry dynamic `aria-label`s built from `sourceLabel`/`targetLabel` (e.g. "Move selected to Selected").
- Keyboard within a panel: `ArrowDown`/`ArrowUp` move the active row, `Home`/`End` jump to the first/last enabled row, `Enter`/`Space` toggles the active row's checkbox. When `filterable` is on, the same `ArrowDown`/`ArrowUp` also work from inside that panel's filter box, and `Escape` there clears that panel's query. Both filter boxes are genuinely disabled (not just visually) while `disabled`/`readOnly`.
- Drag-and-drop is implemented with Angular CDK (`cdkDropList`/`cdkDrag`, disabled rows excluded); the always-visible ▲/▼ buttons next to each panel reorder the keyboard-active row by one position as a non-drag alternative — each panel's row can be hidden independently via `showSourceReorderButtons`/`showTargetReorderButtons` without affecting drag-and-drop or the move buttons.
- A panel's no-results row is a `role="option"` with `aria-disabled="true"` (not `role="presentation"`) — a `role="listbox"` requires at least one option-role child, so an inert "no results" row still needs to satisfy that structural requirement.

## Design notes

**`virtualScroll` and a filtered panel each disable drag-and-drop on
that panel, not just as a v1 gap.** CDK's `CdkDropList` computes
`previousIndex`/`currentIndex` from whatever's currently rendered —
either the mounted-DOM subset (virtualized) or the filtered subset
(that panel's own `filterable` query is active) — not the full-array
positions `onDropped()` assumes. Rather than risk a silently-wrong
reorder/transfer, a panel's `cdkDropList` (both as a drag origin and a
drop target) is disabled whenever either condition holds for THAT
panel — filtering one panel never affects the other's drag
availability. The always-visible ▲/▼ reorder buttons and the
▶/◀/▶▶/◀◀ move buttons are unaffected — both operate on the full array
directly and never touch CDK's mounted-DOM index tracking or the
filtered view — so every Picklist operation remains available while
virtualized or filtered, just not via drag.

**Move-all sweeps up filtered-out rows too.** `▶▶`/`◀◀` always operate
on the full `source()`/`target()` array, regardless of whether either
panel is currently filtered — the same "Move All intentionally includes
disabled options" precedent extends naturally to hidden ones, rather
than adding "only move what's currently visible" logic.

**`canMoveUp`/`canMoveDown` check `disabled` too, not just `readOnly`.**
Earlier versions only gated these on `readOnly`, masked only because
the template separately ANDed in `disabled()` at each call site — a
real inconsistency against every other guard in the component, and
against `DynamoOrderList`'s own equivalent. Both methods now check
`disabled() || readOnly()` directly, so the template no longer needs a
redundant guard at the call site.

**`optionTemplate` has no per-side context.** Unlike a hypothetical
`{ $implicit: option, side: 'source' | 'target' }`, the projected
template only receives the option itself — a template rendering
identically regardless of which panel an option currently lives in is
the expected case, and `side` is recoverable from the surrounding call
site via closure on the rare occasion a consumer needs it.

**Responsive stacking centers along the cross axis, not stretches.**
Below the `sm` breakpoint the root switches to a stacked column
(`items-center`, not `items-stretch`): the move-button row has no
fixed width of its own (unlike the panels' fixed `w-64`), so stretching
it to the root's full width — which is `w-full` by default via
`fluid` — would center its own buttons away from the narrower panels
above/below. `items-center` keeps every child, including the
auto-width button row, aligned together regardless of how much extra
width the root's container gives it. The four move-button glyphs
(▶/◀/▶▶/◀◀) are wrapped in a `rotate-90 sm:rotate-0` span so they keep
pointing the geometrically correct direction (down/up) once their own
column goes from vertical to horizontal.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@angular/cdk` (drag-drop), `@angular/common` (`optionTemplate`'s `NgTemplateOutlet`), `@dynamong/icons`, `@dynamong/virtual-scroll`, `@dynamong/input-text`.

## Running unit tests

Run `nx test forms-picklist` to execute the unit tests.
