# @dynamong/select

A single-select dropdown with optional filtering, grouping, and virtual
scrolling — the `<select>` replacement for when you need custom option
rendering.

## Usage

```html
<dg-select
  [options]="options"
  [(value)]="selectedId"
  [loading]="isSaving()"
  [clearable]="true"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected onItemSelect(option: DynamoSelectOption<string>): void { ... }
```

## Custom templates

Three optional, independently-usable projected templates — each falls back to plain text when
omitted, mirroring `DynamoDataView`'s own `contentChild(TemplateRef)` idiom:

```html
<dg-select [options]="options" [(value)]="value">
  <ng-template #optionTemplate let-option>...</ng-template>
  <ng-template #groupTemplate let-label>...</ng-template>
  <ng-template #selectedTemplate let-option>...</ng-template>
</dg-select>
```

- `#optionTemplate` (`let-option: DynamoSelectOption<TValue>`) — replaces every option row's plain
  `{{ option.label }}` text.
- `#groupTemplate` (`let-label: string`) — replaces every group heading's plain text.
- `#selectedTemplate` (`let-option: DynamoSelectOption<TValue> | null`) — replaces the trigger's own
  `selectedLabel()` text; receives `null` while nothing is selected.

## Editable (free-text) trigger

```html
<dg-select [options]="countries" [(value)]="country" [editable]="true" />
```

`editable` swaps the trigger for a real `<input role="combobox">` (a separate icon-only button still
toggles the panel). Typing commits a value on blur or Enter (when nothing's actively highlighted in an
open panel): text that exactly matches an existing option's label selects that option properly (a real
typed `value`, same as clicking it); anything else commits the raw typed string directly as `value`. An
empty draft clears the value, same as the clear button. Enter while an option is actively highlighted
(arrow-keyed, or auto-highlighted on open) still selects that option instead of committing the draft.

Two scope notes:

- `editable` is only meaningful when `TValue` is/accepts `string` — a committed free-text value is
  always a raw string, cast internally to `TValue`.
- Mutually exclusive with `filterable` — combining both isn't supported (not runtime-guarded).

## Inputs

| Input                   | Type                                                                    | Default                 | Description                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`               | `DynamoSelectOption<TValue>[]` (required)                               | —                       | The option list. Supports an optional `group` field for grouped rendering.                                                                                                                                                                                                                                   |
| `placeholder`           | `string`                                                                | `'Select an option'`    | Shown in the trigger when nothing is selected.                                                                                                                                                                                                                                                               |
| `size`                  | `DynamoSelectSize`                                                      | `'md'`                  |                                                                                                                                                                                                                                                                                                              |
| `variant`               | `DynamoSelectVariant` (`'outlined' \| 'filled'`)                        | `'outlined'`            | `'filled'` swaps the outlined look for a filled surface background — mirrors InputText's `variant`.                                                                                                                                                                                                          |
| `fluid`                 | `boolean`                                                               | `true`                  | Fills the width of its container. Defaults `true` to match every existing consumer's assumption of a full-width trigger; set `false` for PrimeNG-style intrinsic sizing.                                                                                                                                     |
| `ariaLabel`             | `string \| undefined`                                                   | `undefined`             |                                                                                                                                                                                                                                                                                                              |
| `ariaDescribedby`       | `string \| undefined`                                                   | `undefined`             | Associates the trigger with an external help/error message element via `aria-describedby`.                                                                                                                                                                                                                   |
| `value`                 | `TValue \| null` (model)                                                | `null`                  | Two-way bindable; also driven by Angular forms.                                                                                                                                                                                                                                                              |
| `disabled`              | `boolean` (model)                                                       | `false`                 |                                                                                                                                                                                                                                                                                                              |
| `loading`               | `boolean`                                                               | `false`                 | Renders a small spinner in the trigger and makes the component fully non-interactive, like `disabled`. Never emits back.                                                                                                                                                                                     |
| `invalid`               | `boolean`                                                               | `false`                 |                                                                                                                                                                                                                                                                                                              |
| `readOnly`              | `boolean`                                                               | `false`                 | HTML `readonly` semantics: the trigger/panel stay browsable but the value can't be changed or cleared. Unlike `disabled`, doesn't dim the trigger or remove it from the tab order.                                                                                                                           |
| `clearable`             | `boolean`                                                               | `false`                 | Shows an "x" button in the trigger, clearing the value without opening the panel, once a value is selected.                                                                                                                                                                                                  |
| `position`              | `DynamoSelectPosition`                                                  | `'bottom-start'`        |                                                                                                                                                                                                                                                                                                              |
| `filterable`            | `boolean`                                                               | `false`                 | Renders a filter box above the option list. Typeahead is disabled while this is on (focus moves into the filter box instead).                                                                                                                                                                                |
| `filterText`            | `string` (model)                                                        | `''`                    |                                                                                                                                                                                                                                                                                                              |
| `filterPlaceholder`     | `string`                                                                | `'Search...'`           |                                                                                                                                                                                                                                                                                                              |
| `noResultsMessage`      | `string`                                                                | `'No matching options'` |                                                                                                                                                                                                                                                                                                              |
| `virtualScroll`         | `boolean`                                                               | `false`                 | Renders the option list through `@dynamong/virtual-scroll`. Ungrouped lists only.                                                                                                                                                                                                                            |
| `virtualScrollItemSize` | `number`                                                                | `36`                    |                                                                                                                                                                                                                                                                                                              |
| `virtualScrollHeight`   | `number`                                                                | `240`                   |                                                                                                                                                                                                                                                                                                              |
| `selectedIndicator`     | `DynamoSelectSelectedIndicator` (`'none' \| 'checkmark' \| 'checkbox'`) | `'none'`                | `'checkmark'` renders a check icon at the trailing edge of the selected row; `'checkbox'` renders a decorative checkbox-look indicator at the leading edge of every row, checked for the current value — still single-select underneath, matching `@dynamong/multi-select`'s own per-option visual language. |
| `editable`              | `boolean`                                                               | `false`                 | Renders a real typable `<input>` trigger instead of a `<button>` — see "Editable (free-text) trigger" above. Mutually exclusive with `filterable`.                                                                                                                                                           |

## Outputs

| Output                | Payload                      | Fires when                                                                                                                                                                                                                                    |
| --------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`         | `TValue \| null`             | `value` changes (auto-generated by `model()`).                                                                                                                                                                                                |
| `itemSelect`          | `DynamoSelectOption<TValue>` | A user directly selects an option (click or keyboard Enter/Space) — not from programmatic `value` changes.                                                                                                                                    |
| `scrolledIndexChange` | `number`                     | Forwarded 1:1 from `@dynamong/virtual-scroll`'s own output — the index of the first item considered "in view" after each scroll, while `virtualScroll` is on. Drive your own lazy-load fetch from this as the index nears `options().length`. |

## Accessibility

- `role="combobox"` trigger with `aria-expanded`/`aria-controls`/`aria-activedescendant`; `role="listbox"` panel with `role="option"` rows.
- Keyboard: `ArrowDown`/`ArrowUp` open the panel and move the active option, `Home`/`End` jump to the first/last enabled option, `Enter`/`Space` selects, `Escape` closes.
- **Typeahead**: while `filterable` is off, typing a printable character jumps to (and opens, if closed) the first option whose label starts with it. Repeating the same letter cycles through every option starting with it. The buffer resets after ~500ms of no typing.
- `aria-describedby` reflects `ariaDescribedby`. Every option is marked `aria-disabled` while `readOnly` is set (not just individually-disabled ones), signaling that selection is blocked entirely.
- **Known limitation**: `dg-float-label`/`dg-ifta-label` key off a real `<input>`/`<textarea>`'s native `:placeholder-shown` state to decide when to float — Select's default (`editable: false`) trigger is a `<button>`, so it doesn't visually float. Set `editable` to get a real `<input>` trigger that composes with them normally.

## Passthrough (`pt`)

`pt.root` merges onto the trigger's outer wrapper `<div>`, `pt.trigger` onto the combobox `<button>`,
`pt.chevron` onto the chevron `<svg>`, `pt.clear` onto the clear button, `pt.listbox` onto the
`<ul role="listbox">`, `pt.group` onto every group-heading `<li>`, `pt.option` onto every option
`<li>` (`pt.group`/`pt.option` apply the same attrs/class to every matching element, not just one),
and `pt.filterInput` is forwarded into the filter box's own `<dg-input-text>` `pt.input`. `class` is
merged into each part's own built-in classes; every other key is set as a literal DOM attribute via
`@dynamong/core/base`'s `DynamoPassThroughDirective`.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@dynamong/icons`, `@dynamong/input-text`, `@dynamong/spinner`, `@dynamong/virtual-scroll`.

## Running unit tests

Run `nx test forms-select` to execute the unit tests.
