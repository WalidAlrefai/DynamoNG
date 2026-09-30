# @dynamong/textarea

A multi-line text field — a styled native `<textarea>` with optional
auto-resize, wired up as an Angular `ControlValueAccessor`.

## Usage

```html
<dg-textarea
  [(value)]="description"
  [autoResize]="true"
  placeholder="Add a description..."
/>
```

```ts
protected description = signal('');
```

## Inputs

| Input             | Type                                               | Default      | Description                                                                                                                                                                                                                                                             |
| ----------------- | -------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`           | `string` (model)                                   | `''`         | Two-way bindable; also driven by Angular forms (`ngModel`/`formControl`) via `writeValue`.                                                                                                                                                                              |
| `size`            | `DynamoTextareaSize`                               | `'md'`       |                                                                                                                                                                                                                                                                         |
| `variant`         | `DynamoTextareaVariant` (`'outlined' \| 'filled'`) | `'outlined'` | `'filled'` swaps the outlined look for a filled surface background — mirrors InputText's `variant`.                                                                                                                                                                     |
| `fluid`           | `boolean`                                          | `true`       | Fills the width of its container. Defaults `true` to match InputText/DatePicker's own default (and this component's own prior always-full-width behavior); set `false` for intrinsic sizing.                                                                            |
| `placeholder`     | `string`                                           | `''`         |                                                                                                                                                                                                                                                                         |
| `invalid`         | `boolean`                                          | `false`      |                                                                                                                                                                                                                                                                         |
| `rows`            | `number`                                           | `3`          |                                                                                                                                                                                                                                                                         |
| `cols`            | `number \| undefined`                              | `undefined`  | Mirrors `rows` — sets the native `cols` attribute. Unset (native default) unless provided.                                                                                                                                                                              |
| `autoResize`      | `boolean`                                          | `false`      | Grows the textarea's height to fit its content, up to `max-h-96` by default — overridable via `styleClass`/`pt.textarea.class`, which wins through `cn()`/twMerge. Once content exceeds the max height, the element becomes internally scrollable rather than clipping. |
| `ariaLabel`       | `string \| undefined`                              | `undefined`  | Accessible name when no visible `<label>` wraps it.                                                                                                                                                                                                                     |
| `ariaDescribedby` | `string \| undefined`                              | `undefined`  | Associates the textarea with an external help/error message element via `aria-describedby`.                                                                                                                                                                             |
| `disabled`        | `boolean` (model)                                  | `false`      | Two-way bindable; also driven by Angular forms via `setDisabledState`.                                                                                                                                                                                                  |
| `readOnly`        | `boolean`                                          | `false`      | HTML `readonly` semantics: the current value stays visible and the control stays focusable/tabbable, but the user cannot change it. Unlike `disabled`, does not remove it from the tab order or dim its appearance.                                                     |

## Outputs

| Output           | Payload   | Fires when                                                                                                                                                   |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `valueChange`    | `string`  | `value` changes (auto-generated by `model()`) — on every `input` event, and on a programmatic `writeValue`/`autoResize` change.                              |
| `disabledChange` | `boolean` | `disabled` changes (auto-generated by `model()`).                                                                                                            |
| `resized`        | `void`    | Each time `autoResize` adjusts the element's height (typed input, or a programmatic `writeValue`/`autoResize` change). Not emitted when `autoResize` is off. |

## Accessibility

- A plain native `<textarea>`, so keyboard interaction and focus behavior are entirely the browser's own. `aria-invalid`/`aria-readonly` are kept in sync with `invalid`/`readOnly`, `aria-label`/`aria-describedby` are set when provided.

## Passthrough (`pt`)

Textarea is a single bare `<textarea>` — no wrapper element, unlike InputText. `pt.root` and
`pt.textarea`'s `class` are both folded into the one element's classes (there's nowhere else for
`pt.root` to land); only `pt.textarea`'s non-class attrs are applied via `[dgPt]` — `pt.root`'s attrs
aren't applicable here.

## `dgTextarea` directive

Already own the `<textarea>` element — a form built with strict layout selectors, or migrating
existing markup? `DynamoTextareaDirective` (`dgTextarea`) applies the exact same classes directly to an
element you already own, with no `<dg-textarea>` host tag around it — mirrors `dgInputText` closely,
plus its own `autoResize` (listens to the native `input` event directly, since the directive owns no
`[value]` binding of its own to react to):

```html
<textarea
  dgTextarea
  variant="filled"
  [autoResize]="true"
  aria-label="Notes"
></textarea>
```

Scoped down like every other `dgX` directive: styling classes + `aria-invalid` + `autoResize` behavior
only — no `ariaDescribedby`/`cols`/`rows` forwarding inputs (the consumer already owns the element, so
sets attributes directly), no CVA/forms wiring.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test forms-textarea` to execute the unit tests.
