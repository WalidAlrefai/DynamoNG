import { describe, expect, it } from 'vitest';
import {
  filterSelectOptions,
  findEnabledIndex,
  flattenGroupedOptions,
  groupSelectOptions,
} from './select-option-filter';
import type { DynamoSelectOption } from '@dynamong/core/api';

const OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana', disabled: true },
  { label: 'Cherry', value: 'cherry' },
];

describe('filterSelectOptions', () => {
  it('returns the same reference when the query is blank', () => {
    expect(filterSelectOptions(OPTIONS, '')).toBe(OPTIONS);
    expect(filterSelectOptions(OPTIONS, '   ')).toBe(OPTIONS);
  });

  it('matches case-insensitively against the label', () => {
    expect(filterSelectOptions(OPTIONS, 'app').map((o) => o.value)).toEqual([
      'apple',
    ]);
    expect(filterSelectOptions(OPTIONS, 'CHERRY').map((o) => o.value)).toEqual([
      'cherry',
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterSelectOptions(OPTIONS, 'zzz')).toEqual([]);
  });
});

describe('groupSelectOptions / flattenGroupedOptions', () => {
  it('buckets ungrouped options into a single null-group bucket, preserving order', () => {
    const groups = groupSelectOptions(OPTIONS);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.group).toBeNull();
    expect(flattenGroupedOptions(groups)).toEqual(OPTIONS);
  });

  it('buckets by group in first-seen order', () => {
    const grouped: DynamoSelectOption<string>[] = [
      { label: 'Ava', value: 'ava', group: 'Engineering' },
      { label: 'Bea', value: 'bea', group: 'Design' },
      { label: 'Cal', value: 'cal', group: 'Engineering' },
      { label: 'Dee', value: 'dee' },
    ];
    const groups = groupSelectOptions(grouped);
    expect(groups.map((g) => g.group)).toEqual(['Engineering', 'Design', null]);
    expect(groups[0]?.options.map((o) => o.value)).toEqual(['ava', 'cal']);
    expect(groups[1]?.options.map((o) => o.value)).toEqual(['bea']);
    expect(groups[2]?.options.map((o) => o.value)).toEqual(['dee']);
    expect(flattenGroupedOptions(groups).map((o) => o.value)).toEqual([
      'ava',
      'cal',
      'bea',
      'dee',
    ]);
  });
});

describe('findEnabledIndex', () => {
  it('returns null for an empty list', () => {
    expect(findEnabledIndex([], -1, 1)).toBeNull();
  });

  it('finds the first enabled option, skipping disabled ones', () => {
    expect(findEnabledIndex(OPTIONS, -1, 1)).toBe(0);
  });

  it('finds the last enabled option scanning backwards', () => {
    expect(findEnabledIndex(OPTIONS, 0, -1)).toBe(2);
  });

  it('skips a disabled option when stepping forward', () => {
    expect(findEnabledIndex(OPTIONS, 0, 1)).toBe(2);
  });

  it('wraps around when stepping past the end', () => {
    expect(findEnabledIndex(OPTIONS, 2, 1)).toBe(0);
  });

  it('returns null when every option is disabled', () => {
    const allDisabled: DynamoSelectOption<string>[] = [
      { label: 'A', value: 'a', disabled: true },
      { label: 'B', value: 'b', disabled: true },
    ];
    expect(findEnabledIndex(allDisabled, -1, 1)).toBeNull();
  });

  // Regression test: `from = -1` (the "nothing active yet" sentinel) with a
  // *negative* delta used to land one short of the true last index —
  // `(-1 + -1 + length) % length` computes `length - 2`, not `length - 1`.
  // Stepping forward from `-1` happened to work by coincidence
  // (`(-1 + 1 + length) % length === 0`), which is why this only ever
  // surfaced for Arrow Up, never Arrow Down.
  it('finds the true last enabled option when scanning backwards from the unset (-1) sentinel', () => {
    expect(findEnabledIndex(OPTIONS, -1, -1)).toBe(2);
  });

  it('finds the last enabled option scanning backwards from the sentinel, skipping a disabled last option', () => {
    const trailingDisabled: DynamoSelectOption<string>[] = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c', disabled: true },
    ];
    expect(findEnabledIndex(trailingDisabled, -1, -1)).toBe(1);
  });
});
