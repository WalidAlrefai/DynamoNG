import type { DynamoSize } from '@dynamong/core/api';

export type DynamoSelectSize = DynamoSize;
export type DynamoSelectPosition =
  'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export type DynamoSelectPart =
  | 'root'
  | 'trigger'
  | 'chevron'
  | 'clear'
  | 'listbox'
  | 'group'
  | 'option'
  | 'filterInput';

export type { DynamoSelectOption } from '@dynamong/core/api';
