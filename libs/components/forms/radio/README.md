# @dynamong/radio

A single radio button styled around a visually-hidden native
`<input type="radio">`. There is no `RadioGroup` container component —
group siblings the same way plain HTML does, by giving them the same
`name`.

## Usage

```html
<dg-radio
  name="fruit"
  value="apple"
  [checked]="fruit() === 'apple'"
  (checkedChange)="fruit.set('apple')"
  >Apple</dg-radio
>
<dg-radio
  name="fruit"
  value="banana"
  [checked]="fruit() === 'banana'"
  (checkedChange)="fruit.set('banana')"
  >Banana</dg-radio
>
```

```ts
protected fruit = signal('apple');
```

A native `<input type="radio">` never fires `change` on a sibling that
becomes deselected because a different radio sharing its `name` was
clicked, so binding full `[(checked)]="perRadioSignal"` across a group of
siblings will **not** keep them in sync — use the split form above instead,
driving every sibling off the same selection signal. A single, standalone
radio (no siblings sharing `name`) can safely use full two-way `[(checked)]`.

Implements `ControlValueAccessor` too, so a group can instead bind
`formControlName`/`[formControl]`/`[(ngModel)]` — every radio sharing a
`name` even against the _same_ control stays in sync via an internal
registry (mirroring Angular's own built-in `RadioControlValueAccessor`),
since plain CVA propagation between sibling directives on one control
doesn't happen automatically:

```html
<dg-radio name="fruit" value="apple" [formControl]="fruit">Apple</dg-radio>
<dg-radio name="fruit" value="banana" [formControl]="fruit">Banana</dg-radio>
```

## Inputs

| Input             | Type                                            | Default      | Description                                                                                                                                                                                                                                                       |
| ----------------- | ----------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | `string` (required)                             | —            | Shared across sibling radios to form a group.                                                                                                                                                                                                                     |
| `value`           | `string`                                        | `''`         |                                                                                                                                                                                                                                                                   |
| `checked`         | `boolean` (model)                               | `false`      | Two-way bindable — see the grouped-usage caveat above.                                                                                                                                                                                                            |
| `disabled`        | `boolean` (model)                               | `false`      | Two-way bindable; also driven by Angular forms via `setDisabledState`.                                                                                                                                                                                            |
| `readOnly`        | `boolean`                                       | `false`      | HTML `readonly` semantics — the current selection stays visible and the input stays focusable/tabbable, but selecting is blocked. Unlike `disabled`, does not remove the control from the tab order or dim its appearance. Mirrors `DynamoCheckbox`'s `readOnly`. |
| `size`            | `DynamoRadioSize`                               | `'md'`       |                                                                                                                                                                                                                                                                   |
| `variant`         | `DynamoRadioVariant` (`'outlined' \| 'filled'`) | `'outlined'` | `'filled'` swaps the outlined look for a filled surface background while unchecked.                                                                                                                                                                               |
| `invalid`         | `boolean`                                       | `false`      | Applies error styling and sets `aria-invalid`.                                                                                                                                                                                                                    |
| `ariaLabel`       | `string \| undefined`                           | `undefined`  | Accessible name for the native radio when no visible label content is projected.                                                                                                                                                                                  |
| `ariaDescribedby` | `string \| undefined`                           | `undefined`  | Associates the native radio with an external help/error message element via `aria-describedby`.                                                                                                                                                                   |

## Outputs

| Output           | Payload   | Fires when                                                                                                                                                     |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkedChange`  | `boolean` | `checked` changes (auto-generated by `model()`). Only ever emits `true` — a native radio's `change` event never fires when it becomes deselected by a sibling. |
| `disabledChange` | `boolean` | `disabled` changes (auto-generated by `model()`).                                                                                                              |

## Accessibility

- Renders a real native `<input type="radio">` (visually hidden via `sr-only`) inside a `<label>`, so native radio semantics, keyboard behavior (arrow-key movement within a `name` group, Space to select), and label association all come from the browser for free.
- `aria-invalid="true"` is set while `invalid` is true, `aria-readonly="true"` while `readOnly` is true, `aria-describedby` reflects `ariaDescribedby`.

## Registry form-root scoping

`DynamoRadioControlRegistry` (a root-level singleton, since native radio grouping is itself
document-wide by `name`) keeps `formControlName`/`[formControl]`/`[(ngModel)]`-bound sibling radios in
sync — mirroring Angular's own `RadioControlRegistry`. It now also mirrors that registry's form-root
scoping: two radios only sync each other's selection if they resolve the **same** `AbstractControl.root`
(each radio optionally injects its own `NgControl` to find this), so two independent reactive-forms
radio groups elsewhere in the app that happen to reuse the same `name` no longer cross-contaminate each
other's selection. Radios using the plain split-binding group pattern (no `NgControl` at all) fall back
to the original name-only match, unaffected by this.

## Passthrough (`pt`)

`pt.root` merges onto the outer `<label>`, `pt.input` onto the native (visually-hidden) `<input>`,
`pt.circle` onto the visual circle `<span>`, `pt.label` onto the text `<span>`. `class` is merged into
each part's own built-in classes; every other key is set as a literal DOM attribute via
`@dynamong/core/base`'s `DynamoPassThroughDirective`.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/forms` (`ControlValueAccessor`).

## Running unit tests

Run `nx test forms-radio` to execute the unit tests.
