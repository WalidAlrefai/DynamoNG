# @dynamong/multi-select

A multi-select dropdown with tags in the trigger, select-all/clear-all, an
optional cap on selection count, and optional filtering/virtual scrolling.

## Usage

```html
<dg-multi-select
  [options]="options"
  [(value)]="selectedIds"
  [loading]="isSaving()"
  [maxSelected]="5"
  (itemSelect)="onItemSelect($event)"
  (tagRemoved)="onTagRemoved($event)"
/>
```

```ts
protected onItemSelect(option: DynamoSelectOption<string>): void { ... }
```

## Custom templates

Three optional, independently-usable projected templates — each falls back to plain text when
omitted, mirroring `DynamoSelect`'s own `contentChild(TemplateRef)` idiom:

```html
<dg-multi-select [options]="options" [(value)]="value">
  <ng-template #optionTemplate let-option>...</ng-template>
  <ng-template #groupTemplate let-label>...</ng-template>
  <ng-template #tagTemplate let-option>...</ng-template>
</dg-multi-select>
```

- `#optionTemplate` (`let-option: DynamoSelectOption<TValue>`) — replaces every option row's plain
  `{{ option.label }}` text.
- `#groupTemplate` (`let-label: string`) — replaces every group heading's plain text.
- `#tagTemplate` (`let-option: DynamoSelectOption<TValue>`) — replaces only the label content inside
  each tag pill. The pill wrapper and its real, independently-focusable remove `<button>` stay exactly
  as today, outside the templated region — a11y/`stopPropagation` wiring never shifts onto the
  consumer. Does **not** apply to the trigger's "+N more" overflow pill (from `maxVisibleTags`), which
  is a count summary, not a per-option render.

## Chip input (`editableTags`)

```html
<dg-multi-select [options]="options" [(value)]="value" [editableTags]="true" />
```

`editableTags` renders a real typable `<input>` alongside the tag pills. Typing and committing (Enter,
comma, or blur) adds a new tag: text that exactly matches an existing option's label selects that
option properly (a real typed `value`, same as clicking it) — unless it's already selected, in which
case re-typing its label is a no-op (it never unselects it); anything else is appended as a raw string
(only meaningful when `TValue` is/accepts `string`), deduplicated against existing values. Unlike
Select's `editable`, committing a tag does **not** close the panel — adding one tag is expected to be
followed by adding more.

Three scope notes:

- Free-text raw-string tags are never touched by the header select-all/clear-all checkbox (`selectAll`/
  `clearAll` both stay scoped to `filteredOptions()`, i.e. real options only) — only `clearable`'s
  trigger-level × button, or an individual tag's own remove button, clears them. This is intentional,
  not a bug.
- `editableTags` is mutually exclusive with `filterable` in v1 — combining both isn't supported (not
  runtime-guarded). Unifying the chip input as a live filter driver (narrowing the option list as you
  type, replacing the separate filter box) is a real, larger possible follow-up, not pursued yet.
- Only meaningful when `TValue` is/accepts `string`, same caveat as Select's `editable`.

## Inputs

| Input                   | Type                                             | Default                           | Description                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`               | `DynamoSelectOption<TValue>[]` (required)        | —                                 |                                                                                                                                                                                                       |
| `placeholder`           | `string`                                         | `'Select options'`                |                                                                                                                                                                                                       |
| `size`                  | `DynamoSelectSize`                               | `'md'`                            |                                                                                                                                                                                                       |
| `variant`               | `DynamoSelectVariant` (`'outlined' \| 'filled'`) | `'outlined'`                      | `'filled'` swaps the outlined look for a filled surface background — mirrors Select's `variant`.                                                                                                      |
| `fluid`                 | `boolean`                                        | `true`                            | Fills the width of its container; set `false` for intrinsic sizing.                                                                                                                                   |
| `ariaLabel`             | `string \| undefined`                            | `undefined`                       |                                                                                                                                                                                                       |
| `ariaDescribedby`       | `string \| undefined`                            | `undefined`                       | Associates the trigger with an external help/error message element via `aria-describedby`.                                                                                                            |
| `value`                 | `TValue[]` (model)                               | `[]`                              | Two-way bindable array of selected values; also driven by Angular forms.                                                                                                                              |
| `disabled`              | `boolean` (model)                                | `false`                           |                                                                                                                                                                                                       |
| `loading`               | `boolean`                                        | `false`                           | Renders a small spinner in the trigger and makes the component fully non-interactive, like `disabled`.                                                                                                |
| `invalid`               | `boolean`                                        | `false`                           |                                                                                                                                                                                                       |
| `readOnly`              | `boolean`                                        | `false`                           | HTML `readonly` semantics: the trigger/panel stay browsable but selections can't be added, removed, or cleared. Unlike `disabled`, doesn't dim the trigger or remove it from the tab order.           |
| `clearable`             | `boolean`                                        | `false`                           | Shows a trigger-level clear (×) button once at least one option is selected, clearing the whole selection at once — distinct from the header select-all checkbox's clear-visible-selections behavior. |
| `position`              | `DynamoSelectPosition`                           | `'bottom-start'`                  |                                                                                                                                                                                                       |
| `filterable`            | `boolean`                                        | `false`                           | Typeahead is disabled while this is on.                                                                                                                                                               |
| `filterText`            | `string` (model)                                 | `''`                              |                                                                                                                                                                                                       |
| `filterPlaceholder`     | `string`                                         | `'Search...'`                     |                                                                                                                                                                                                       |
| `noResultsMessage`      | `string`                                         | `'No matching options'`           |                                                                                                                                                                                                       |
| `virtualScroll`         | `boolean`                                        | `false`                           | Ungrouped lists only.                                                                                                                                                                                 |
| `virtualScrollItemSize` | `number`                                         | `36`                              |                                                                                                                                                                                                       |
| `virtualScrollHeight`   | `number`                                         | `240`                             |                                                                                                                                                                                                       |
| `maxSelected`           | `number \| undefined`                            | `undefined`                       | Caps the number of selections; remaining unselected options become disabled once reached.                                                                                                             |
| `maxSelectedMessage`    | `string`                                         | `'Maximum selections reached'`    |                                                                                                                                                                                                       |
| `showSelectAll`         | `boolean`                                        | `true`                            |                                                                                                                                                                                                       |
| `selectAllLabel`        | `string`                                         | `'Select all'`                    |                                                                                                                                                                                                       |
| `maxVisibleTags`        | `number \| undefined`                            | `undefined`                       | Collapses the trigger's tag list to the first N plus a "+N more" summary.                                                                                                                             |
| `overflowLabelFn`       | `(count: number) => string`                      | `` (count) => `+${count} more` `` |                                                                                                                                                                                                       |
| `editableTags`          | `boolean`                                        | `false`                           | Renders a real typable `<input>` alongside the tag pills — see "Chip input (`editableTags`)" above. Mutually exclusive with `filterable`.                                                             |

## Outputs

| Output                | Payload                      | Fires when                                                                                                                                                                |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`         | `TValue[]`                   | `value` changes (auto-generated by `model()`).                                                                                                                            |
| `itemSelect`          | `DynamoSelectOption<TValue>` | A user directly toggles an option (check or uncheck) — not from `selectAll()`/`clearAll()`/the header checkbox.                                                           |
| `tagRemoved`          | `TValue`                     | A tag's remove button is clicked (in addition to `value` updating).                                                                                                       |
| `scrolledIndexChange` | `number`                     | Forwarded 1:1 from `@dynamong/virtual-scroll`'s own output, while `virtualScroll` is on — drive your own lazy-load fetch from this as the index nears `options().length`. |

## Accessibility

- `role="combobox"` trigger (a `<div>`, not a native button — supports the tag list), `role="listbox"` panel.
- Keyboard: `ArrowDown`/`ArrowUp` open and move the active option, `Home`/`End` jump, `Enter`/`Space` toggles the active option, `Escape` closes.
- **Typeahead**: while `filterable` is off, typing jumps the active highlight to the first option whose label starts with it — it does **not** auto-toggle the option, since silently checking a box from incidental typing would be a surprising model mutation. Repeating a letter cycles through matches; the buffer resets after ~500ms.
- `ariaDescribedby` reflects onto the trigger's `aria-describedby`, same as Select's.
- The trigger-level "+N more" overflow pill (from `maxVisibleTags`) carries an `aria-label` listing the hidden options' labels (e.g. `"Also selected: Cherry, Potato"`) — its own visible "+N more" text alone carries no information about which options those are.

## Passthrough (`pt`)

`pt.root` and `pt.trigger` both merge onto the same trigger `<div>` — unlike `DynamoSelect`, there's no
separate inner `<button>` to split them onto (each tag's remove control is a real `<button>`, and a
`<button>` can't legally contain another `<button>`, so the `<div>` wrapper itself is the combobox).
`pt.tag`/`pt.tagRemove` apply to every tag pill/its remove button, `pt.overflowTag` onto the "+N more"
pill, `pt.chevron` onto the chevron `<svg>`, `pt.clear` onto the trigger-level clear button,
`pt.listbox` onto the `<ul role="listbox">`, `pt.group`/`pt.option`/`pt.optionCheckbox` onto every
matching group heading/option row/checkbox indicator, and `pt.filterInput` is forwarded into the filter
box's own `<dg-input-text>` `pt.input`. `pt.selectAll` and `pt.clearAll` both merge onto the one
tri-state header `<dg-checkbox>` (`selectAll` wins on class/attribute key collisions, since it's the
control's primary identity — there's no separate element for each). `pt.chipInput` targets the
`editableTags` free-text input, when rendered. `class` is merged into each part's own built-in classes;
every other key is set as a literal DOM attribute via `@dynamong/core/base`'s
`DynamoPassThroughDirective`.

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/core`, `@dynamong/select`, `@dynamong/checkbox`, `@dynamong/icons`, `@dynamong/input-text`, `@dynamong/spinner`, `@dynamong/virtual-scroll`.

## Running unit tests

Run `nx test forms-multi-select` to execute the unit tests.
