# @dynamong/input-text

A styled single-line text input. Implements `ControlValueAccessor`, so it
works with `formControl`/`ngModel` in addition to `[(value)]`.

## Usage

```html
<dg-input-text
  type="email"
  placeholder="you@example.com"
  [(value)]="email"
  [invalid]="emailInvalid()"
/>
```

```ts
protected readonly email = signal('');
```

## Inputs

| Input             | Type                                                                                    | Default      | Description                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`            | `DynamoInputTextType` (`'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'`) | `'text'`     |                                                                                                                                                                                                                             |
| `size`            | `DynamoSize`                                                                            | `'md'`       |                                                                                                                                                                                                                             |
| `variant`         | `DynamoInputTextVariant` (`'outlined' \| 'filled'`)                                     | `'outlined'` | `'filled'` swaps the surface-0 background/bordered look for a filled surface-100 background with a transparent border.                                                                                                      |
| `placeholder`     | `string`                                                                                | `''`         |                                                                                                                                                                                                                             |
| `invalid`         | `boolean`                                                                               | `false`      |                                                                                                                                                                                                                             |
| `ariaLabel`       | `string \| undefined`                                                                   | `undefined`  | Accessible name for the input when no visible `<label>` wraps it (e.g. a bare search box).                                                                                                                                  |
| `ariaDescribedby` | `string \| undefined`                                                                   | `undefined`  | Associates the input with an external help/error message element's `id` via `aria-describedby`.                                                                                                                             |
| `disabled`        | `boolean` (model)                                                                       | `false`      | Two-way bindable; also driven by Angular forms via `setDisabledState`.                                                                                                                                                      |
| `readOnly`        | `boolean`                                                                               | `false`      | HTML `readonly` semantics: the current value stays visible and the control stays focusable/tabbable, but the user cannot change it. Unlike `disabled`, doesn't remove the control from the tab order or dim its appearance. |
| `fluid`           | `boolean`                                                                               | `true`       | Fills the width of its container. Defaults `true` to match every existing consumer's assumption of a full-width input; set `false` for PrimeNG-style intrinsic sizing.                                                      |
| `showClear`       | `boolean`                                                                               | `false`      | Shows a clear button once there's a value (hidden while `disabled`/`readOnly`); clicking it empties the value and refocuses the input.                                                                                      |
| `clearAriaLabel`  | `string`                                                                                | `'Clear'`    | Accessible name for the clear button.                                                                                                                                                                                       |
| `value`           | `string` (model)                                                                        | `''`         | Two-way bindable; also driven by Angular forms via `writeValue`.                                                                                                                                                            |

## Outputs

| Output           | Payload   | Fires when                                     |
| ---------------- | --------- | ---------------------------------------------- |
| `valueChange`    | `string`  | `value` changes (auto-generated by `model()`). |
| `disabledChange` | `boolean` | `disabled` changes.                            |

## Accessibility

- Renders a native `<input>`, inheriting its keyboard and text-editing semantics for free.
- `aria-invalid` is set while `invalid` is true, `aria-readonly` while `readOnly` is true, `aria-label` when `ariaLabel` is set, `aria-describedby` when `ariaDescribedby` is set.
- The clear button (`showClear`) is a native `<button type="button">`, so it's keyboard-focusable and activatable with Space/Enter for free; give it a translated name via `clearAriaLabel` if your app isn't English-only.

## Directive (`dgInputText`)

An attribute-directive form — applies InputText's styling classes directly to an existing native
`<input>`, with no wrapping `<dg-input-text>` host tag. Mirrors PrimeNG's `pInputText` directive:

```html
<input dgInputText variant="filled" [invalid]="emailInvalid()" />
```

Deliberately scoped smaller than the component — with no template of its own, it can't own child DOM
the way `<dg-input-text>`'s clear-button system does:

| Input                              | Notes                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `size`/`variant`/`invalid`/`fluid` | Same as the component — applied as real classes, additively (a pre-existing static `class` on the element is preserved). |
| `invalid`                          | Also toggles `aria-invalid` on the element, same semantics as the component.                                             |

Not supported (arrange these yourself — you already own the element):

- `showClear`/`clearAriaLabel` — there's no template to render a clear button into; add your own if you need one.
- `disabled`/`readOnly` — plain native HTML attributes; set them directly.
- `ariaLabel`/`ariaDescribedby`/`pt` — set these attributes on the input directly; there's no wrapper for them to be forwarded through.

## Passthrough (`pt`)

`pt.root` merges extra attributes/classes onto the wrapper element (only present in the DOM box model
while `showClear` is on — it's `display: contents` otherwise, so it never affects layout); `pt.input`
merges onto the native `<input>` itself — e.g.
`[pt]="{ input: { 'data-testid': 'email-input', class: 'ring-2 ring-danger' } }"`. `class` is merged
into each part's own built-in classes (still applies even when `unstyled` is true); every other key is
set as a literal DOM attribute via `@dynamong/core/base`'s `DynamoPassThroughDirective`.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test forms-input-text` to execute the unit tests.
