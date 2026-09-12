# @dynamong/tag

A small static label for status or category display — a colored chip, not
an interactive control.

## Usage

```html
<dg-tag severity="success" variant="outline" size="sm">Active</dg-tag>
```

```ts
protected readonly status = signal<DynamoSeverity>('success');
```

## Inputs

| Input      | Type                                        | Default     | Description |
| ---------- | ------------------------------------------- | ----------- | ----------- |
| `severity` | `DynamoSeverity`                            | `'primary'` |             |
| `variant`  | `DynamoTagVariant` (`'solid' \| 'outline'`) | `'solid'`   |             |
| `size`     | `DynamoSize`                                | `'md'`      |             |

## Outputs

None — this component has no outputs.

## Accessibility

- Renders a plain `<span>` with projected content — no interactive semantics of its own. If the tag conveys meaning beyond its visible text, label the surrounding context yourself.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-tag` to execute the unit tests.
