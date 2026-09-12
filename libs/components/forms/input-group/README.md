# @dynamong/input-group

A bordered wrapper that adds `prefix`/`suffix` content — an icon, a `$`
sign, a unit label, a button — around any projected input.

## Usage

```html
<dg-input-group [size]="'md'" [invalid]="false">
  <span prefix>$</span>
  <input type="text" placeholder="0.00" />
  <span suffix>.00</span>
</dg-input-group>
```

Because every DynamoNG input already renders its own border, a `<dg-input-text>`
(or similar) placed inside should be given `[unstyled]="true"` so only the
group's border shows.

## Inputs

| Input     | Type         | Default | Description |
| --------- | ------------ | ------- | ----------- |
| `size`    | `DynamoSize` | `'md'`  |             |
| `invalid` | `boolean`    | `false` |             |

Content is projected via two named slots — `[prefix]` and `[suffix]` — plus a
default slot for the input itself. There is deliberately no `disabled` input:
disabling is the projected input's own job, since a wrapper-level dim would
create a "set it in two places" footgun.

## Outputs

None.

## Accessibility

- Purely presentational — a bordered `<div>` wrapper with no interactive
  semantics of its own. Accessibility (labeling, disabled state, etc.) is
  owned entirely by whatever input is projected into it.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test forms-input-group` to execute the unit tests.
