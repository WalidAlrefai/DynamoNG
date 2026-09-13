# @dynamong/divider

A horizontal or vertical rule for visually separating content, with an
optional inline label (horizontal orientation only).

## Usage

```html
<dg-divider orientation="horizontal">OR</dg-divider>
<dg-divider orientation="vertical" />
```

## Inputs

| Input         | Type                       | Default        | Description                                                                                      |
| ------------- | -------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `orientation` | `DynamoDividerOrientation` | `'horizontal'` | `'horizontal' \| 'vertical'`. Projected content (a label) only renders in the horizontal layout. |

## Outputs

None.

## Accessibility

- `role="separator"` on the root, with `aria-orientation="vertical"` added for the vertical layout. Purely presentational otherwise — no interactive behavior.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils` (plus Angular core/CDK).

## Running unit tests

Run `nx test panel-divider` to execute the unit tests.
