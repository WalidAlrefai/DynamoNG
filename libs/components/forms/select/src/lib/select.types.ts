import type { DynamoSize } from '@dynamong/core/api';

export type DynamoSelectSize = DynamoSize;
export type DynamoSelectVariant = 'outlined' | 'filled';
/** `'none'` (default) is today's plain-text-only option row. `'checkmark'` renders a check icon at
 *  the trailing edge of the selected row. `'checkbox'` renders a decorative (non-focusable) checkbox
 *  look at the leading edge, matching `@dynamong/multi-select`'s own per-option visual language —
 *  still single-select underneath, purely cosmetic. */
export type DynamoSelectSelectedIndicator = 'none' | 'checkmark' | 'checkbox';
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
