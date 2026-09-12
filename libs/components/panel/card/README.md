# @dynamong/card

A simple content container with an optional header/subheader and a footer
content-projection slot, in three visual variants.

## Usage

```html
<dg-card header="Team members" subheader="12 active" variant="outlined">
  Card body content goes here.
  <div footer>
    <dg-button>View all</dg-button>
  </div>
</dg-card>
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `header` | `string` | `''` | Title text. The header block only renders when `header` or `subheader` is set. |
| `subheader` | `string` | `''` | Subtitle text shown below the header. |
| `variant` | `DynamoCardVariant` | `'elevated'` | `'elevated' \| 'outlined' \| 'filled'`. |

Body content is projected via the default slot; footer content via `<div footer>` (an element with a `footer` attribute), projected into a dedicated footer region.

## Outputs

None — `dg-card` is a passive container.

## Accessibility

- Purely presentational — a styled `<div>` wrapper with an `<h3>` for `header` and a `<p>` for `subheader` when present. It has no roles or keyboard behavior of its own; add a heading landmark, `aria-label`, or `aria-labelledby` from the outside if the surrounding context needs one.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils` (plus Angular core/CDK).

## Running unit tests

Run `nx test panel-card` to execute the unit tests.
