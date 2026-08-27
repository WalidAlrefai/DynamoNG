import type { DynamoSelectOption } from '@dynamong/core/api';

export interface DynamoListboxOptionGroup<T> {
  readonly group: string | null;
  readonly options: readonly DynamoSelectOption<T>[];
}

/**
 * Buckets options by `group` in first-seen order; ungrouped options land in
 * one `group: null` bucket. Adapted from DynamoSelect's `groupSelectOptions`
 * — reimplemented locally rather than imported from `@dynamong/select`,
 * matching TreeSelect's precedent that a handful of small pure functions
 * don't justify a sibling-package tier-coupling.
 */
export function groupListboxOptions<T>(
  options: readonly DynamoSelectOption<T>[],
): readonly DynamoListboxOptionGroup<T>[] {
  const order: (string | null)[] = [];
  const buckets = new Map<string | null, DynamoSelectOption<T>[]>();

  for (const option of options) {
    const key = option.group ?? null;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
      order.push(key);
    }
    bucket.push(option);
  }

  return order.map((key) => ({ group: key, options: buckets.get(key) ?? [] }));
}

/** Flattens grouped options back into the flat, render-order list keyboard nav / activeIndex operate over. */
export function flattenGroupedListboxOptions<T>(
  groups: readonly DynamoListboxOptionGroup<T>[],
): readonly DynamoSelectOption<T>[] {
  return groups.flatMap((group) => group.options);
}

/**
 * Scans from `from`, stepping by `delta` (wrapping), for the next
 * non-disabled option index. Returns `null` if every option is disabled or
 * the list is empty. Adapted from DynamoSelect's `findEnabledIndex`.
 */
export function findEnabledListboxIndex<T>(
  options: readonly DynamoSelectOption<T>[],
  from: number,
  delta: number,
): number | null {
  if (options.length === 0) return null;

  let index = from;
  for (let step = 0; step < options.length; step++) {
    index = (index + delta + options.length) % options.length;
    if (!options[index]?.disabled) {
      return index;
    }
  }
  return null;
}
