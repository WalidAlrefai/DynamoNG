# @dynamong/meter-group

A multi-segment labelled meter bar with a legend — for showing a breakdown
(disk usage, budget split, quota). For a single value, use `DynamoProgress`
instead.

## Usage

```html
<dg-meter-group
  [value]="usageSegments"
  [max]="100"
  orientation="horizontal"
  [showLegend]="true"
/>
```

```ts
protected readonly usageSegments: DynamoMeterItem[] = [
  { label: 'Used', value: 42, severity: 'primary' },
  { label: 'Cached', value: 18, severity: 'secondary' },
];
```

## Inputs

| Input         | Type                                                         | Default        | Description                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`       | `DynamoMeterItem[]` (required)                               | —              | Each item is `{ label, value, severity?, color? }`. `color` (a CSS color string) overrides `severity` when set.                                                                |
| `max`         | `number`                                                     | `100`          | The total the full track represents. Segments size as `item.value / max`; if the segment values sum past `max`, they're scaled down proportionally so the bar never overflows. |
| `orientation` | `DynamoMeterGroupOrientation` (`'horizontal' \| 'vertical'`) | `'horizontal'` |                                                                                                                                                                                |
| `showLegend`  | `boolean`                                                    | `true`         |                                                                                                                                                                                |
| `size`        | `DynamoSize`                                                 | `'md'`         |                                                                                                                                                                                |
| `ariaLabel`   | `string \| undefined`                                        | `undefined`    | When unset, an accessible label is auto-built from every item's label and value (e.g. `"Meter: Used 42, Cached 18"`).                                                          |

## Outputs

None — this component has no outputs.

## Accessibility

- The track is `role="group"` with an `aria-label` (explicit `ariaLabel` or the auto-built summary). Each segment is `role="meter"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`/`aria-label`. Legend swatches are `aria-hidden`.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-meter-group` to execute the unit tests.
