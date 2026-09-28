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

| Input             | Type                  | Default     | Description                                                                                                                                                                                                                   |
| ----------------- | --------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `severity`        | `DynamoSeverity`      | `'primary'` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'danger'`.                                                                                                                                                   |
| `variant`         | `DynamoChipVariant`   | `'solid'`   | `'solid' \| 'outline'`.                                                                                                                                                                                                       |
| `size`            | `DynamoSize`          | `'md'`      | `'sm' \| 'md' \| 'lg'`.                                                                                                                                                                                                       |
| `removable`       | `boolean`             | `false`     | Shows a remove button. The chip itself is never removed from the DOM by this component — the consumer handles removal via `removed`.                                                                                          |
| `removeAriaLabel` | `string`              | `'Remove'`  | `aria-label` for the remove button.                                                                                                                                                                                           |
| `disabled`        | `boolean`             | `false`     | Dims the chip and disables the remove button; the click/keyboard remove path becomes a no-op.                                                                                                                                 |
| `image`           | `string \| undefined` | `undefined` | Renders a small, pre-styled circular avatar `<img src="image">` ahead of the label — a dedicated leading visual for a photo/avatar use case, distinct from the generic `[icon]` slot below (which has no styling of its own). |
| `imageAlt`        | `string`              | `''`        | Alt text for `image`. Defaults to decorative (`''`) — the chip's own label content already carries the accessible name.                                                                                                       |

Content is projected via plain `<ng-content>`. A projected `[icon]`-attributed
element (e.g. an icon component or `<img>`) renders ahead of the label:
`<dg-chip><dg-icon-check icon />Verified</dg-chip>`.

For a photo/avatar leading visual instead, use `image` rather than the
`[icon]` slot — it gets a dedicated circular clip and fixed size (matching
`size`), which the generic `[icon]` slot doesn't provide on its own:

```html
<dg-chip [image]="user.photoUrl">{{ user.name }}</dg-chip>
```

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
