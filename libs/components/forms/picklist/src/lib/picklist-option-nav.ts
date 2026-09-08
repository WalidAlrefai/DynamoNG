import type { DynamoSelectOption } from '@dynamong/core/api';

/**
 * Scans from `from`, stepping by `delta` (wrapping), for the next
 * non-disabled option index. Returns `null` if every option is disabled or
 * the list is empty. Adapted from Listbox's `findEnabledListboxIndex` —
 * reimplemented locally rather than imported, per this session's precedent
 * of not cross-importing small pure algorithms between sibling
 * type:component packages (TreeSelect/Cascade Select/Listbox itself all do
 * this).
 */
export function findEnabledPicklistIndex<T>(
  options: readonly DynamoSelectOption<T>[],
  from: number,
  delta: number,
): number | null {
  if (options.length === 0) {
    return null;
  }

  let index = from;
  for (let step = 0; step < options.length; step++) {
    index = (index + delta + options.length) % options.length;
    if (!options[index]?.disabled) {
      return index;
    }
  }
  return null;
}
