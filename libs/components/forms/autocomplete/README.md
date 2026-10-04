# @dynamong/autocomplete

A free-typed text input backed by a type-to-filter suggestion panel.

## Usage

```html
<dg-autocomplete
  [options]="options"
  [(value)]="query"
  [loading]="isSearching()"
  [readOnly]="isLocked()"
  (optionSelect)="onOptionSelect($event)"
/>
```

```ts
protected onOptionSelect(option: DynamoSelectOption<string>): void { ... }
```

## Inputs

| Input                   | Type                                      | Default                 | Description                                                                                                                                                                                                                          |
| ----------------------- | ----------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`               | `DynamoSelectOption<TValue>[]` (required) | —                       |                                                                                                                                                                                                                                      |
| `placeholder`           | `string`                                  | `''`                    |                                                                                                                                                                                                                                      |
| `size`                  | `DynamoSelectSize`                        | `'md'`                  |                                                                                                                                                                                                                                      |
| `ariaLabel`             | `string \| undefined`                     | `undefined`             |                                                                                                                                                                                                                                      |
| `ariaDescribedby`       | `string \| undefined`                     | `undefined`             | Forwarded as `aria-describedby` on the field.                                                                                                                                                                                        |
| `fluid`                 | `boolean`                                 | `true`                  | `true` renders the field `w-full`; `false` shrinks it to content width.                                                                                                                                                              |
| `invalid`               | `boolean`                                 | `false`                 |                                                                                                                                                                                                                                      |
| `disabled`              | `boolean` (model)                         | `false`                 | Also driven by Angular forms.                                                                                                                                                                                                        |
| `readOnly`              | `boolean`                                 | `false`                 | HTML `readonly` semantics — the current text stays visible and focusable, but typing and the suggestion panel are blocked.                                                                                                           |
| `loading`               | `boolean`                                 | `false`                 | Renders a small spinner over the field and makes the component fully non-interactive, like `disabled`.                                                                                                                               |
| `clearable`             | `boolean`                                 | `false`                 | Shows an × button that clears the typed text. Hidden while `loading` (shares the same trailing slot).                                                                                                                                |
| `clearAriaLabel`        | `string`                                  | `'Clear'`               |                                                                                                                                                                                                                                      |
| `position`              | `DynamoSelectPosition`                    | `'bottom-start'`        |                                                                                                                                                                                                                                      |
| `noResultsMessage`      | `string`                                  | `'No matching options'` |                                                                                                                                                                                                                                      |
| `virtualScroll`         | `boolean`                                 | `false`                 | Ungrouped lists only.                                                                                                                                                                                                                |
| `virtualScrollItemSize` | `number`                                  | `36`                    |                                                                                                                                                                                                                                      |
| `virtualScrollHeight`   | `number`                                  | `240`                   |                                                                                                                                                                                                                                      |
| `value`                 | `string` (model)                          | `''`                    | The free-typed text — never constrained to an option's value. Also driven by Angular forms.                                                                                                                                          |
| `lazy`                  | `boolean`                                 | `false`                 | Opt-in server-side/async mode: `options()` is trusted to already be the current suggestion set — this component stops filtering it locally by the typed text. Pair with `(searchQuery)` to fetch matching options as the user types. |
| `debounceTime`          | `number`                                  | `300`                   | Milliseconds to wait after the last keystroke before emitting `searchQuery`.                                                                                                                                                         |
| `minLength`             | `number`                                  | `1`                     | Minimum typed length before `searchQuery` fires. Below this, no request is made and no event is emitted.                                                                                                                             |

## Outputs

| Output         | Payload                      | Fires when                                                                                                                                                                                                                                                                                    |
| -------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`  | `string`                     | `value` changes (auto-generated by `model()`), including every keystroke.                                                                                                                                                                                                                     |
| `optionSelect` | `DynamoSelectOption<TValue>` | A suggestion is picked (click or Enter). Kept as its own name rather than the `itemSelect` convention used elsewhere — it already carries the full option object and shipped before that convention existed, so renaming it would be a gratuitous breaking change with no behavioral benefit. |
| `searchQuery`  | `string`                     | Only in `lazy` mode: the typed text, debounced by `debounceTime`, once it reaches `minLength`. Named `searchQuery` rather than `search` to avoid colliding with the native DOM `search` event.                                                                                                |

## Accessibility

- Native `<input>` field with `role="combobox"` semantics via ARIA attributes; `role="listbox"` suggestion panel.
- Keyboard: `ArrowDown`/`ArrowUp` open the panel and move the active suggestion, `Home`/`End` jump, `Enter` picks the active suggestion, `Escape` closes.
- **No dedicated typeahead**: every keystroke already does full substring filtering of the option list via `value`, which is a strict superset of jump-to-match typeahead — layering a separate keydown buffer on top would be inert (the list is already narrowed to matches) or would double-handle the same keystroke.
- Nothing is pre-highlighted while typing (`aria-activedescendant` stays unset) — a deliberate resting
  state, not an oversight; see the `minLength`/active-index notes below.

## Design notes

**`minLength` gates typing-driven open/close in both modes**, not just `lazy`'s own `searchQuery`
emission. Below `minLength`, typing neither opens the panel nor (in `lazy` mode) fires a request;
backspacing back below it while open closes the panel. Keyboard-driven opening (`ArrowDown`/`ArrowUp`
while closed) deliberately stays un-gated — an escape hatch to browse the current list regardless of
typed length.

**The active-index revalidation effect** (re-validates `activeIndex` if `visibleOptions()` changes while
the panel is open — relevant for `lazy` mode's async result swaps) is adapted from `DynamoSelect`'s own
identical effect, with one deliberate difference: `activeIndex < 0` is never treated as invalid here.
Unlike Select, where `-1` only occurs in a genuine degenerate case, Autocomplete's own `onInput`
intentionally resets `activeIndex` to `-1` on every keystroke so nothing is pre-highlighted while typing
— promoting that back to `0` would silently let Enter select a suggestion the user never navigated to.

**`clearable`** mirrors `DynamoInputText`'s own `showClear`, not `DynamoSelect`'s button-trigger
`clearable` — the field here is a bare `<input>`, so the × button is absolutely positioned inside the
same `relative` wrapper the loading spinner already uses, sharing its trailing slot (never shown
simultaneously).

**`optionTemplate`/`groupTemplate`** are ported directly from `DynamoSelect`'s own template slots.
Select's third slot, `selectedTemplate` (for the trigger's own selected-value display), has **no
Autocomplete equivalent** — the field just shows the raw typed `value()` string, not a specific option's
templated label.

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/core`, `@dynamong/select`, `@dynamong/spinner`,
  `@dynamong/virtual-scroll`.

## Running unit tests

Run `nx test forms-autocomplete` to execute the unit tests.
