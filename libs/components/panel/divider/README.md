# @dynamong/divider

A horizontal or vertical rule for visually separating content, with an
optional label projected between two line segments in either orientation.

## Usage

```html
<dg-divider orientation="horizontal">OR</dg-divider>
<dg-divider orientation="vertical" />
<dg-divider type="dashed" align="left">Section</dg-divider>
```

## Inputs

| Input         | Type                       | Default        | Description                                                                                                                                                                                                                                                                             |
| ------------- | -------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orientation` | `DynamoDividerOrientation` | `'horizontal'` | `'horizontal' \| 'vertical'`.                                                                                                                                                                                                                                                           |
| `type`        | `DynamoDividerLineStyle`   | `'solid'`      | `'solid' \| 'dashed' \| 'dotted'` — the line's border style.                                                                                                                                                                                                                            |
| `align`       | `DynamoDividerAlign`       | `'center'`     | `'left' \| 'center' \| 'right'` (horizontal) or `'top' \| 'center' \| 'bottom'` (vertical) — shifts the label toward one end by shrinking the line segment on that side. A value that doesn't match the current `orientation` (e.g. `'top'` while horizontal) falls back to `'center'`. |

## Outputs

None.

## Accessibility

- `role="separator"` on the root, with `aria-orientation="vertical"` added for the vertical layout. Purely presentational otherwise — no interactive behavior.

## Design notes

`align` also lets vertical dividers project a label — the label rendering
was previously horizontal-only; the vertical branch now uses the same
before-line/label/after-line structure so `align="top"`/`"bottom"` behaves
consistently with the horizontal `"left"`/`"right"` cases.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils` (plus Angular core/CDK).

## Running unit tests

Run `nx test panel-divider` to execute the unit tests.
