import type { DynamoSize } from '@dynamong/core/api';

export type DynamoListboxSize = DynamoSize;
export type DynamoListboxPart = 'root' | 'option' | 'group-heading' | 'checkbox';
export type DynamoListboxValue<TValue> = TValue | TValue[] | null;

// DynamoSelectOption (label/value/disabled?/group?) already lives in
// @dynamong/core/api and is reused as-is by Select/MultiSelect/Pagination/
// TreeSelect/Select Button — re-exported here, not redeclared.
export type { DynamoSelectOption } from '@dynamong/core/api';
