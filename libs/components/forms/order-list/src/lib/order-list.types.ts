import type { DynamoSize } from '@dynamong/core/api';

export type DynamoOrderListSize = DynamoSize;

export type DynamoOrderListPart =
  | 'root'
  | 'header'
  | 'list'
  | 'option'
  | 'checkbox'
  | 'controls';

// `DynamoSelectOption` (label/value/disabled?) already lives in
// `@dynamong/core/api` and is reused across Select/Listbox/Picklist — re-exported
// here, not redeclared, same as `picklist.types.ts`.
export type { DynamoSelectOption } from '@dynamong/core/api';
