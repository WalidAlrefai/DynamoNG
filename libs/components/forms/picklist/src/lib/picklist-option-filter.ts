import type { DynamoSelectOption } from '@dynamong/core/api';

/**
 * Case-insensitive substring match against each option's label. Same-
 * reference passthrough on a blank query — mirrors `filterOrderListOptions`
 * in `@dynamong/order-list`, reimplemented locally rather than imported,
 * matching this codebase's established precedent of not cross-importing
 * small pure algorithms between sibling `type:component` packages (see
 * `picklist-option-nav.ts`'s own doc comment re: `findEnabledPicklistIndex`).
 */
export function filterPicklistOptions<T>(
  options: readonly DynamoSelectOption<T>[],
  query: string,
): readonly DynamoSelectOption<T>[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return options;
  }
  return options.filter((option) =>
    option.label.toLowerCase().includes(trimmed),
  );
}
