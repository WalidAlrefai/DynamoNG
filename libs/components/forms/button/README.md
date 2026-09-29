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

| Input              | Type                                                                                   | Default     | Description                                                                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `severity`         | `DynamoSeverity`                                                                       | `'primary'` |                                                                                                                                                                                                                                                                                      |
| `size`             | `DynamoSize`                                                                           | `'md'`      |                                                                                                                                                                                                                                                                                      |
| `variant`          | `DynamoButtonVariant` (`'solid' \| 'outline' \| 'text' \| 'link'`)                     | `'solid'`   | `'link'` never gets a hover background (unlike `'text'`'s `hover:bg-*/10`) — colored text, underlined only on hover.                                                                                                                                                                 |
| `type`             | `DynamoButtonType` (`'button' \| 'submit' \| 'reset'`)                                 | `'button'`  |                                                                                                                                                                                                                                                                                      |
| `disabled`         | `boolean`                                                                              | `false`     |                                                                                                                                                                                                                                                                                      |
| `loading`          | `boolean`                                                                              | `false`     | Renders an inline `<dg-spinner size="sm">` before the projected content and forces the button disabled (`isDisabled = disabled() \|\| loading()`).                                                                                                                                   |
| `ariaLabel`        | `string \| undefined`                                                                  | `undefined` | Forwarded to the native `<button>` as `aria-label`. Needed for icon-only usage.                                                                                                                                                                                                      |
| `ariaCurrent`      | `'page' \| 'step' \| 'location' \| 'date' \| 'time' \| 'true' \| 'false' \| undefined` | `undefined` | Forwarded as `aria-current` — e.g. `'page'` for a pagination control's active page button.                                                                                                                                                                                           |
| `role`             | `string \| undefined`                                                                  | `undefined` | Forwarded as `role`, overriding the implicit button role — e.g. `'radio'` for a button acting as one segment of a single-select group.                                                                                                                                               |
| `ariaChecked`      | `boolean \| undefined`                                                                 | `undefined` | Forwarded as `aria-checked` — for a button acting as a radio-group segment.                                                                                                                                                                                                          |
| `ariaPressed`      | `boolean \| undefined`                                                                 | `undefined` | Forwarded as `aria-pressed` — for a button acting as a toggle in a multi-select group.                                                                                                                                                                                               |
| `tabIndexOverride` | `number \| undefined`                                                                  | `undefined` | Forwarded as `tabindex`, overriding the default tab-stop membership — for roving-tabindex patterns like Select Button's segmented control.                                                                                                                                           |
| `fullWidth`        | `boolean`                                                                              | `false`     | Stretches the button to fill its container's width (`w-full`) instead of the default `inline-flex` sizing.                                                                                                                                                                           |
| `raised`           | `boolean`                                                                              | `false`     | Adds a shadow. Composes with any `variant`, including `'text'`/`'link'` (PrimeNG's "Raised Text").                                                                                                                                                                                   |
| `rounded`          | `boolean`                                                                              | `false`     | Pill-shaped (`rounded-full`) instead of the default `rounded-md`.                                                                                                                                                                                                                    |
| `iconOnly`         | `boolean`                                                                              | `false`     | Square padding sized to `size` instead of the default horizontal padding. Pair with `ariaLabel` — there's no visible text for the accessible name to come from.                                                                                                                      |
| `iconPos`          | `DynamoButtonIconPos` (`'left' \| 'right' \| 'top' \| 'bottom'`)                       | `'left'`    | Where the projected `[icon]` (or the `loading` spinner, which takes its place) sits relative to the label. `'top'`/`'bottom'` also stack the button's content vertically. Visual only — reordering is CSS (`order`), not DOM/projection order, which Angular requires staying fixed. |

Content is projected via plain `<ng-content>`. A projected `[icon]`-attributed element renders ahead
of (or, per `iconPos`, visually reordered relative to) the label — the same `[icon]` slot convention
as Chip/Alert/Tag: `<dg-button><svg icon>...</svg>Save</dg-button>`. While `loading` is true, the
built-in spinner takes the icon slot's place regardless of what's projected there.

## Outputs

None beyond the native `(click)` event — Button doesn't wrap it in a custom output; bind directly to the underlying `<button>`'s native `click`.

## Accessibility

- Renders a native `<button>`, inheriting its keyboard and click semantics for free (Space/Enter activation, correct focus behavior).
- `aria-busy` is set while `loading` is true.
- `ariaCurrent`/`role`/`ariaChecked`/`ariaPressed`/`tabIndexOverride` are opt-in forwards used by other DynamoNG components (e.g. Select Button) to compose Button into ARIA radio-group/toggle-group patterns.

## Badge

Button has no `badge`/`badgeSeverity` inputs of its own — compose `@dynamong/overlay-badge` around it
instead, which already works today with no changes needed on either side:

```html
<dg-overlay-badge [value]="unreadCount()" severity="danger">
  <dg-button ariaLabel="Notifications">Inbox</dg-button>
</dg-overlay-badge>
```

This is deliberate: baking badge support into Button would add `@dynamong/overlay-badge` (and
transitively `@dynamong/badge`) as new peer dependencies for every consumer, and would change
Button's DOM root from `<button>` to a wrapping `<span>`, breaking the `pt.root`/ARIA-forwarding
contracts below that target the native `<button>` directly.

## Button Group

`<dg-button-group>` (same package, `@dynamong/button`) visually merges adjacent `<dg-button>`
children into one connected control — a plain CSS-only wrapper with no knowledge of Button's own TS
API, so it works with any `<dg-button>` children as-is:

```html
<dg-button-group ariaLabel="Text formatting">
  <dg-button variant="outline">Bold</dg-button>
  <dg-button variant="outline">Italic</dg-button>
  <dg-button variant="outline">Underline</dg-button>
</dg-button-group>
```

`ariaLabel` is forwarded to the wrapper's `role="group"` element. Each button keeps its own
`disabled`/`loading`/click handling independently — there's no group-level state.

## Directive (`dgButton`)

An attribute-directive form — applies Button's styling classes directly to an existing native
`<button>`, with no wrapping `<dg-button>` host tag. Mirrors PrimeNG's `pButton` directive:

```html
<button dgButton severity="danger" [raised]="true">Delete</button>
```

Deliberately scoped smaller than the component — with no template of its own, it can't own child
DOM the way `<dg-button>`'s `[icon]`/`iconPos` slot system does:

| Input                                                                 | Notes                                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `severity`/`size`/`variant`/`fullWidth`/`raised`/`rounded`/`iconOnly` | Same as the component — applied as real classes, additively (a pre-existing static `class` on the element is preserved).                                                                                                    |
| `disabled`/`loading`                                                  | Sets the native `disabled` property and `aria-busy` — same semantics as the component, but no spinner is injected (there's no template to add one to; render your own loading indicator inside the button if you want one). |

Not supported (arrange these yourself — you already own the element):

- `icon`/`iconPos` — just write your own markup directly inside the button, in whatever order you want.
- `ariaLabel`/`ariaCurrent`/`role`/`ariaChecked`/`ariaPressed`/`tabIndexOverride`/`pt` — set these attributes on the button directly; there's no wrapper for them to be forwarded through.

## Passthrough (`pt`)

`pt.root` merges extra attributes/classes directly onto the native `<button>` — e.g.
`[pt]="{ root: { 'data-testid': 'save-button', class: 'ring-2 ring-danger' } }"`. `class` is merged
into Button's own built-in classes (still applies even when `unstyled` is true); every other key is
set as a literal DOM attribute via `@dynamong/core/base`'s `DynamoPassThroughDirective`.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@dynamong/spinner`.

## Running unit tests

Run `nx test forms-button` to execute the unit tests.
