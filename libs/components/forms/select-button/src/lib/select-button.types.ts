import type { DynamoSize } from '@dynamong/core/api';

export type DynamoSelectButtonSize = DynamoSize;
export type DynamoSelectButtonPart = 'root' | 'segment';
export type DynamoSelectButtonValue<TValue> = TValue | TValue[] | null;

// DynamoSelectOption (label/value/disabled?/group?) already lives in
// @dynamong/core/api and is reused as-is by Select/MultiSelect/Pagination's
// page-size dropdown — re-exported here, not redeclared, since there's no
// decoupling benefit to a parallel local type when core/api is already the
// shared dependency every forms component sits on.
export type { DynamoSelectOption } from '@dynamong/core/api';
