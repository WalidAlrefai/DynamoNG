# @dynamong/input-number

A numeric text input with increment/decrement buttons, min/max clamping,
and step snapping — plugs into Angular forms as a `ControlValueAccessor`.

## Usage

```html
<dg-input-number
  [(value)]="quantity"
  [min]="0"
  [max]="100"
  [step]="5"
  ariaLabel="Quantity"
/>
```

## Inputs

| Input               | Type                      | Default     | Description                                                                                                                                                                                                                |
| ------------------- | ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`              | `DynamoSize`              | `'md'`      |                                                                                                                                                                                                                            |
| `placeholder`       | `string`                  | `''`        |                                                                                                                                                                                                                            |
| `invalid`           | `boolean`                 | `false`     |                                                                                                                                                                                                                            |
| `ariaLabel`         | `string \| undefined`     | `undefined` |                                                                                                                                                                                                                            |
| `disabled`          | `boolean` (model)         | `false`     | Two-way bindable; also driven by Angular forms via `setDisabledState`.                                                                                                                                                     |
| `readOnly`          | `boolean`                 | `false`     | HTML `readonly` semantics — value stays visible and focusable/tabbable but not editable. Unlike `disabled`, doesn't remove the control from the tab order or dim it; also disables the increment/decrement buttons.        |
| `min`               | `number \| undefined`     | `undefined` |                                                                                                                                                                                                                            |
| `max`               | `number \| undefined`     | `undefined` |                                                                                                                                                                                                                            |
| `step`              | `number`                  | `1`         | Used by the buttons, `ArrowUp`/`ArrowDown` (one step) and `PageUp`/`PageDown` (ten steps), and to snap committed values to a `min`-relative grid.                                                                          |
| `mode`              | `'decimal' \| 'currency'` | `'decimal'` | `'currency'` requires `currency` to also be set.                                                                                                                                                                           |
| `currency`          | `string \| undefined`     | `undefined` | ISO 4217 code (e.g. `'USD'`), required when `mode` is `'currency'`.                                                                                                                                                        |
| `locale`            | `string \| undefined`     | `undefined` | BCP 47 tag passed to `Intl.NumberFormat`; `undefined` uses the runtime's default locale.                                                                                                                                   |
| `useGrouping`       | `boolean`                 | `true`      | Thousands separators in the blurred display.                                                                                                                                                                               |
| `minFractionDigits` | `number \| undefined`     | `undefined` |                                                                                                                                                                                                                            |
| `maxFractionDigits` | `number \| undefined`     | `undefined` |                                                                                                                                                                                                                            |
| `prefix`            | `string \| undefined`     | `undefined` | Literal text shown flush against the input, outside the editable value (e.g. a unit label) — never part of the parsed number.                                                                                              |
| `suffix`            | `string \| undefined`     | `undefined` | Same, on the trailing side.                                                                                                                                                                                                |
| `value`             | `number \| null` (model)  | `null`      | Two-way bindable; also driven by Angular forms via `writeValue`. Free-typed text is only parsed/clamped/snapped on blur (or Enter-adjacent commit paths), so partial input like `"-"` or `"12."` isn't clobbered mid-edit. |

While focused, the field shows the plain number (e.g. `"1234"`) so typing
never fights with grouping separators or a currency symbol; once blurred, it
re-renders through `Intl.NumberFormat` (e.g. `"1,234"` or `"$1,234.00"`).

The `[incrementIcon]` / `[decrementIcon]` content-projection slots replace
the default `+`/`−` glyphs with any projected icon, e.g.:

```html
<dg-input-number [(value)]="qty">
  <dg-icon-plus incrementIcon />
  <dg-icon-minus decrementIcon />
</dg-input-number>
```

## Outputs

| Output           | Payload          | Fires when                                                                                                                                                                             |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`    | `number \| null` | `value` changes (auto-generated by `model()`) — on commit (blur), the increment/decrement buttons, or keyboard stepping. Unparseable typed text is discarded on blur without emitting. |
| `disabledChange` | `boolean`        | `disabled` changes (auto-generated by `model()`).                                                                                                                                      |

## Accessibility

- A native `<input>` with adjacent increment/decrement buttons; pair with a
  `<label>` or set `ariaLabel` when no visible label wraps it.
- Keyboard: `ArrowUp`/`ArrowDown` step by `step`, `PageUp`/`PageDown` step by
  `step * 10`, `Home`/`End` jump to `min`/`max`.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/forms` (`ControlValueAccessor`).

## Running unit tests

Run `nx test forms-input-number` to execute the unit tests.
