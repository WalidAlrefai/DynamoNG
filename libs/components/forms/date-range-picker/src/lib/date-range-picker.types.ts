import type { DynamoSize } from '@dynamong/core/api';

export type DynamoDateRangePickerSize = DynamoSize;
export type DynamoDateRangePickerPart = 'root' | 'trigger' | 'panel' | 'day';

/** A closed date range. Either end may be `null` while a selection is in progress or unset. */
export interface DynamoDateRange {
  start: Date | null;
  end: Date | null;
}
