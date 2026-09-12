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

| Input       | Type                  | Default     | Description                                                                                                                                           |
| ----------- | --------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`     | `number`              | `0`         | Clamped to `0`–`100`; `NaN` is treated as `0`. Drives both the fill width and the ARIA attributes from one derived value, so they can never disagree. |
| `severity`  | `DynamoSeverity`      | `'primary'` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'danger'`. Colors the fill.                                                          |
| `size`      | `DynamoSize`          | `'md'`      | `'sm' \| 'md' \| 'lg'`. Controls the track's height.                                                                                                  |
| `ariaLabel` | `string \| undefined` | `undefined` | Falls back to `'Progress'` when unset.                                                                                                                |

## Outputs

None.

## Accessibility

- Root is `role="progressbar"` with `aria-valuenow` (the clamped value), `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label`.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-progress` to execute the unit tests.
