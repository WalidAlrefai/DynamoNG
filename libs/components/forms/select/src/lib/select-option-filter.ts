import type { DynamoSelectOption } from '@dynamong/core/api';

/** Case-insensitive substring match against each option's label. Same-reference passthrough on a blank query, mirrors `filterRows` in `@dynamong/table`. */
export function filterSelectOptions<T>(
  options: readonly DynamoSelectOption<T>[],
  query: string,
): readonly DynamoSelectOption<T>[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return options;
  return options.filter((option) =>
    option.label.toLowerCase().includes(trimmed),
  );
}

export interface DynamoSelectOptionGroup<T> {
  readonly group: string | null;
  readonly options: readonly DynamoSelectOption<T>[];
}

/** Buckets options by their `group` field in first-seen order; ungrouped options land in one `group: null` bucket. Ungrouped input round-trips through unchanged (single null bucket, original order preserved). */
export function groupSelectOptions<T>(
  options: readonly DynamoSelectOption<T>[],
): readonly DynamoSelectOptionGroup<T>[] {
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

/** Flattens grouped options back into the flat, render-order list that keyboard nav / activeIndex operate over. */
export function flattenGroupedOptions<T>(
  groups: readonly DynamoSelectOptionGroup<T>[],
): readonly DynamoSelectOption<T>[] {
  return groups.flatMap((group) => group.options);
}

/** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled option index. Returns `null` if every option is disabled or the list is empty. Generalizes `DynamoSelect`'s and `DynamoMenu`'s identical private implementations. */
export function findEnabledIndex<T>(
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
