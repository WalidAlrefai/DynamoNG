# @dynamong/button

A standard interactive button. Renders a native `<button>`, styled by
severity/variant/size, with a built-in loading state that swaps in an
inline `@dynamong/spinner` and disables the control.

## Usage

```html
<dg-button
  severity="primary"
  variant="solid"
  size="md"
  [loading]="isSaving()"
  (click)="onSave()"
>
  Save
</dg-button>
```

```ts
protected onSave(): void { ... }
```

## Inputs

| Input              | Type                                                                                   | Default     | Description                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `severity`         | `DynamoSeverity`                                                                       | `'primary'` |                                                                                                                                                    |
| `size`             | `DynamoSize`                                                                           | `'md'`      |                                                                                                                                                    |
| `variant`          | `DynamoButtonVariant` (`'solid' \| 'outline' \| 'text'`)                               | `'solid'`   |                                                                                                                                                    |
| `type`             | `DynamoButtonType` (`'button' \| 'submit' \| 'reset'`)                                 | `'button'`  |                                                                                                                                                    |
| `disabled`         | `boolean`                                                                              | `false`     |                                                                                                                                                    |
| `loading`          | `boolean`                                                                              | `false`     | Renders an inline `<dg-spinner size="sm">` before the projected content and forces the button disabled (`isDisabled = disabled() \|\| loading()`). |
| `ariaLabel`        | `string \| undefined`                                                                  | `undefined` | Forwarded to the native `<button>` as `aria-label`. Needed for icon-only usage.                                                                    |
| `ariaCurrent`      | `'page' \| 'step' \| 'location' \| 'date' \| 'time' \| 'true' \| 'false' \| undefined` | `undefined` | Forwarded as `aria-current` — e.g. `'page'` for a pagination control's active page button.                                                         |
| `role`             | `string \| undefined`                                                                  | `undefined` | Forwarded as `role`, overriding the implicit button role — e.g. `'radio'` for a button acting as one segment of a single-select group.             |
| `ariaChecked`      | `boolean \| undefined`                                                                 | `undefined` | Forwarded as `aria-checked` — for a button acting as a radio-group segment.                                                                        |
| `ariaPressed`      | `boolean \| undefined`                                                                 | `undefined` | Forwarded as `aria-pressed` — for a button acting as a toggle in a multi-select group.                                                             |
| `tabIndexOverride` | `number \| undefined`                                                                  | `undefined` | Forwarded as `tabindex`, overriding the default tab-stop membership — for roving-tabindex patterns like Select Button's segmented control.         |

## Outputs

None beyond the native `(click)` event — Button doesn't wrap it in a custom output; bind directly to the underlying `<button>`'s native `click`.

## Accessibility

- Renders a native `<button>`, inheriting its keyboard and click semantics for free (Space/Enter activation, correct focus behavior).
- `aria-busy` is set while `loading` is true.
- `ariaCurrent`/`role`/`ariaChecked`/`ariaPressed`/`tabIndexOverride` are opt-in forwards used by other DynamoNG components (e.g. Select Button) to compose Button into ARIA radio-group/toggle-group patterns.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@dynamong/spinner`.

## Running unit tests

Run `nx test forms-button` to execute the unit tests.
