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
});
