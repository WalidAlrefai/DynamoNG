# @dynamong/scroll-top

A floating "back to top" button that appears once the page has been scrolled
past a threshold and smooth-scrolls back to the top on click.

## Usage

```html
<dg-scroll-top [threshold]="300" ariaLabel="Back to top" />
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `threshold` | `number` | `200` | Scroll offset (px) past which the button becomes visible. |
| `ariaLabel` | `string` | `'Scroll to top'` | |

## Outputs

None — the button is entirely self-contained; there's nothing to subscribe to.

## Accessibility

- Renders as a native `<button type="button">`, removed from the DOM entirely (not just hidden) while below the threshold. Its icon is `aria-hidden`; the button's accessible name comes from `ariaLabel`.
- No custom keyboard handling is needed — it's a plain button, reachable and activatable (`Enter`/`Space`) like any other.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils` (plus Angular core/CDK).

## Running unit tests

Run `nx test overlay-scroll-top` to execute the unit tests.
