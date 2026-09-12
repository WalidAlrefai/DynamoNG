# @dynamong/style-class

A lightweight structural directive (`[dgStyleClass]`) — not a visible
component — that mutates CSS classes on another element each time its host
is clicked. It's the show/hide-by-classlist toggler ported from PrimeNG's
`pStyleClass`, useful for CSS-driven disclosure (accordions, dropdowns,
simple panels) without any overlay/portal machinery.

## Usage

```html
<button dgStyleClass="@next" toggleClass="hidden">Toggle</button>
<div class="hidden">Panel content</div>
```

```html
<button
  dgStyleClass="#menu"
  enterClass="opacity-100"
  leaveClass="opacity-0"
  [hideOnOutsideClick]="true"
>
  Open
</button>
<div id="menu" class="opacity-0">...</div>
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `dgStyleClass` (selector alias for `target`) | `string` (required) | — | A CSS selector, or one of the relative keywords `'@next'`, `'@prev'`, `'@parent'`, `'@grandparent'`, identifying the element whose classes get mutated. |
| `toggleClass` | `string \| undefined` | `undefined` | A single class simply toggled on the target on each click. When set, takes priority over `enterClass`/`leaveClass`. |
| `enterClass` | `string \| undefined` | `undefined` | Added to the target (and `leaveClass` removed) when transitioning to shown. Only used when `toggleClass` is unset. |
| `leaveClass` | `string \| undefined` | `undefined` | Added to the target (and `enterClass` removed) when transitioning to hidden. Only used when `toggleClass` is unset. |
| `hideOnOutsideClick` | `boolean` | `false` | While shown, a document click outside both the host and the target hides the target again. |

## Outputs

None — this directive mutates the target element's `classList` directly; there's nothing to subscribe to.

## Accessibility

- Purely a class-mutation behavior: it adds no ARIA attributes or roles of its own. Since it typically toggles visibility-affecting classes (e.g. `hidden`), pair it with the appropriate `aria-expanded` (on the host) and/or `aria-hidden` (on the target) yourself if the pair forms a disclosure widget — this directive doesn't set those for you.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/common — this directive doesn't depend on `@dynamong/core` or `@dynamong/utils`.

## Running unit tests

Run `nx test overlay-style-class` to execute the unit tests.
