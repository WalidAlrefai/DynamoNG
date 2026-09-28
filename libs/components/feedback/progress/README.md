# @dynamong/progress

A horizontal progress bar for a determinate 0–100 value — task completion,
upload/download progress, or step-through wizards.

## Usage

```html
<dg-progress
  [value]="uploadPercent()"
  severity="success"
  size="sm"
  ariaLabel="Upload progress"
/>
```

## Inputs

| Input           | Type                  | Default     | Description                                                                                                                                                                              |
| --------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`         | `number`              | `0`         | Clamped to `0`–`100`; `NaN` is treated as `0`. Drives both the fill width and the ARIA attributes from one derived value, so they can never disagree.                                    |
| `severity`      | `DynamoSeverity`      | `'primary'` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'danger'`. Colors the fill.                                                                                             |
| `size`          | `DynamoSize`          | `'md'`      | `'sm' \| 'md' \| 'lg'`. Controls the track's height.                                                                                                                                     |
| `ariaLabel`     | `string \| undefined` | `undefined` | Falls back to `'Progress'` when unset.                                                                                                                                                   |
| `indeterminate` | `boolean`             | `false`     | Renders an animated, unmeasured loading bar. `value` is ignored and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` are omitted, per WAI-ARIA guidance for an indeterminate progressbar. |
| `color`         | `string \| undefined` | `undefined` | Explicit CSS color for the fill — overrides `severity` when set, mirroring `DynamoMeterItem.color`.                                                                                      |
| `showValue`     | `boolean`             | `false`     | Renders the current percentage as a trailing label next to the bar. Ignored when `indeterminate` is true.                                                                                |

### Design notes: `showValue` renders a trailing label, not an inside-bar overlay

PrimeNG's `ProgressBar` overlays its `showValue` percentage text inside the bar itself, which only
works there because its bar is a fixed ~1.5rem tall. This component's track heights (`sm` 6px /
`md` 8px / `lg` 10px) are intentionally much thinner and too small to legibly host inline text — an
inside-bar overlay would also have no single text color that reads well against both the colored
fill and the neutral unfilled track. `showValue` instead renders the percentage as a label next to
the bar, matching the same `text-text-muted` treatment `@dynamong/meter-group` already uses for its
own adjacent value labels.

## Outputs

None.

## Accessibility

- Root is `role="progressbar"` with `aria-valuenow` (the clamped value), `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label` — all three value attributes are omitted when `indeterminate` is true.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-progress` to execute the unit tests.
