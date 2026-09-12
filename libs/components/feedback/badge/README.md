# @dynamong/badge

A small severity-colored label, typically for a status word or count —
purely presentational, with no interactive behavior of its own.

## Usage

```html
<dg-badge severity="success" variant="outline" size="sm">Active</dg-badge>
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `severity` | `DynamoSeverity` | `'primary'` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'danger'`. |
| `variant` | `DynamoBadgeVariant` | `'solid'` | `'solid' \| 'outline'`. |
| `size` | `DynamoSize` | `'md'` | `'sm' \| 'md' \| 'lg'`. |

Content is projected via plain `<ng-content>`.

## Outputs

None.

## Accessibility

- A plain `<span>` with no role of its own — it inherits meaning from its projected text content. Nothing beyond semantic HTML is needed since it isn't interactive.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-badge` to execute the unit tests.
