import type { DynamoSelectOption } from '@dynamong/core/api';

/** Builds a `DynamoSelectOption`, filling in reasonable defaults for unspecified fields. */
export function createMockSelectOption<TValue = string>(
  overrides: Partial<DynamoSelectOption<TValue>> = {},
): DynamoSelectOption<TValue> {
  return {
    label: 'Option',
    value: 'option' as unknown as TValue,
    ...overrides,
  };
}

/** Builds an array of `count` distinct mock options, labeled `Option 1`, `Option 2`, ... */
export function createMockSelectOptions(count: number): DynamoSelectOption<string>[] {
  return Array.from({ length: count }, (_, index) =>
    createMockSelectOption({ label: `Option ${index + 1}`, value: `option-${index + 1}` }),
  );
}
