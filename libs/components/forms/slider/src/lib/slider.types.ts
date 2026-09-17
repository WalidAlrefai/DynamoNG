export type DynamoSliderPart = 'root' | 'track' | 'fill' | 'thumb';

/**
 * The `value` shape when `range` is `true` — named fields (not `min`/`max`,
 * which would collide with `DynamoSlider`'s own `min()`/`max()` inputs at
 * call sites like `value().min`), mirroring `DynamoDateRangePicker`'s own
 * `DynamoDateRange { start, end }` named-field convention adapted to this
 * domain's field names.
 */
export interface DynamoSliderRange {
  minValue: number;
  maxValue: number;
}
