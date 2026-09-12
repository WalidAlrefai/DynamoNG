# @dynamong/chip

A compact, severity-colored token for a tag or selected filter, with an
optional remove button — for use in tag lists and multi-select "selected
items" rows.

## Usage

```html
<dg-chip severity="secondary" [removable]="true" (removed)="onRemove(tag)">
  {{ tag.label }}
</dg-chip>
```

```ts
protected onRemove(tag: Tag): void { ... }
```

## Inputs

| Input             | Type                | Default     | Description                                                                                                                          |
| ----------------- | ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `severity`        | `DynamoSeverity`    | `'primary'` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'danger'`.                                                          |
| `variant`         | `DynamoChipVariant` | `'solid'`   | `'solid' \| 'outline'`.                                                                                                              |
| `size`            | `DynamoSize`        | `'md'`      | `'sm' \| 'md' \| 'lg'`.                                                                                                              |
| `removable`       | `boolean`           | `false`     | Shows a remove button. The chip itself is never removed from the DOM by this component — the consumer handles removal via `removed`. |
| `removeAriaLabel` | `string`            | `'Remove'`  | `aria-label` for the remove button.                                                                                                  |

Content is projected via plain `<ng-content>`.

## Outputs

| Output    | Payload | Fires when                    |
| --------- | ------- | ----------------------------- |
| `removed` | `void`  | The remove button is clicked. |

## Accessibility

- A plain `<span>` root; the remove button carries the `removeAriaLabel` text and hides its icon from assistive tech with `aria-hidden`.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-chip` to execute the unit tests.
