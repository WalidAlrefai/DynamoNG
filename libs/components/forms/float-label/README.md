# @dynamong/float-label

Two stateless, pure-CSS wrapper components that give a single projected form
control a floating or permanently-visible label: `dg-float-label`
(`DynamoFloatLabel`) floats the label above the field on focus/fill; the
"In-Form-That-Always" `dg-ifta-label` (`DynamoIftaLabel`) instead pins the
label to the top-inside of the field, always visible, for dense forms.
Association with the wrapped control is implicit — the control lives
_inside_ the `<label>` element, so no `for`/`id` wiring is needed. The
projected control must carry a `placeholder` attribute (a single space is
fine) so the filled state can be detected via `:placeholder-shown`.

## Usage

```html
<dg-float-label label="Email" variant="over">
  <dg-input-text [(value)]="email" placeholder=" " />
</dg-float-label>

<dg-ifta-label label="Email">
  <dg-input-text [(value)]="email" placeholder=" " />
</dg-ifta-label>
```

## Inputs

`dg-float-label` (`DynamoFloatLabel`):

| Input     | Type                      | Default  | Description                                                                                                                                                                                                                                                                          |
| --------- | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`   | `string` (required)       | —        |                                                                                                                                                                                                                                                                                      |
| `variant` | `DynamoFloatLabelVariant` | `'over'` | `'over'` — the label sits over the field at rest and floats up to overlap the top border when focused or filled (classic Material style). `'in'` — floats to a small size inside the field's top padding. `'on'` — floats onto the border with a background chip cutting through it. |

`dg-ifta-label` (`DynamoIftaLabel`):

| Input   | Type                | Default | Description |
| ------- | ------------------- | ------- | ----------- |
| `label` | `string` (required) | —       |             |

## Outputs

Neither component has any outputs — both are purely presentational, stateless wrappers with no internal state to change.

## Accessibility

- Both render a `<label>` wrapping the projected control, so the label/control association is implicit through DOM nesting. Nothing beyond that — no additional roles or keyboard handling, since all interactive behavior belongs to the projected control itself.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test forms-float-label` to execute the unit tests.
