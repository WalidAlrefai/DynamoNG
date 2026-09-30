import type { DynamoSize } from '@dynamong/core/api';

export type DynamoDatePickerSize = DynamoSize;
export type DynamoDatePickerVariant = 'outlined' | 'filled';
export type DynamoDatePickerPart =
  'root' | 'trigger' | 'panel' | 'day' | 'time-field' | 'apply-button';
export type DynamoDatePickerHourFormat = '12' | '24';
export type DynamoDatePickerView = 'date' | 'month' | 'year' | 'time';
export type DynamoDatePickerSelectionMode = 'single' | 'multiple';
