import type { DynamoSize } from '@dynamong/core/api';

export type DynamoPicklistSize = DynamoSize;
export type DynamoPicklistSide = 'source' | 'target';
export type DynamoPicklistPart =
  | 'root'
  | 'sourcePanel'
  | 'targetPanel'
  | 'option'
  | 'checkbox'
  | 'moveButtons'
  | 'reorderButtons';

// DynamoSelectOption (label/value/disabled?/group?) already lives in
// @dynamong/core/api and is reused as-is by Select/MultiSelect/Pagination/
// TreeSelect/Select Button/Listbox — re-exported here, not redeclared.
// `group` goes unused by Picklist (no grouping in v1) but the shared type
// isn't redeclared just to drop one optional field.
export type { DynamoSelectOption } from '@dynamong/core/api';
