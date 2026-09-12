import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
  type DynamoTypeaheadItem,
} from './typeahead';

const ITEMS: DynamoTypeaheadItem[] = [
  { label: 'Apple' },
  { label: 'Banana' },
  { label: 'Jackfruit' },
  { label: 'Jicama', disabled: true },
  { label: 'Juniper' },
];

describe('findTypeaheadMatch', () => {
  it('returns the index of the first item whose label starts with the query, case-insensitively', () => {
    expect(findTypeaheadMatch(ITEMS, -1, 'ban')).toBe(1);
    expect(findTypeaheadMatch(ITEMS, -1, 'BAN')).toBe(1);
  });

  it('starts scanning strictly after fromIndex, so a stable buffer cycles forward rather than re-matching the current item first', () => {
    expect(findTypeaheadMatch(ITEMS, 2, 'j')).toBe(4);
  });

  it('skips disabled items', () => {
    expect(findTypeaheadMatch(ITEMS, 2, 'jic')).toBeNull();
  });

  it('wraps around to the start when no match exists after the current position', () => {
    expect(findTypeaheadMatch(ITEMS, 4, 'a')).toBe(0);
  });

  it('returns null when nothing matches', () => {
    expect(findTypeaheadMatch(ITEMS, -1, 'zzz')).toBeNull();
  });

  it('returns null for an empty list or an empty query', () => {
    expect(findTypeaheadMatch([], -1, 'a')).toBeNull();
    expect(findTypeaheadMatch(ITEMS, -1, '')).toBeNull();
  });
});

describe('resolveTypeaheadQuery', () => {
  it('returns a single character unchanged', () => {
    expect(resolveTypeaheadQuery('j')).toBe('j');
  });

  it('returns the full buffer for a non-repeated multi-character sequence', () => {
    expect(resolveTypeaheadQuery('jac')).toBe('jac');
  });

  it('collapses an all-same-character buffer to one character', () => {
    expect(resolveTypeaheadQuery('jjj')).toBe('j');
  });
});

describe('createTypeaheadBuffer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accumulates characters typed within the reset window', () => {
    const buffer = createTypeaheadBuffer();
    expect(buffer.append('j')).toBe('j');
    vi.advanceTimersByTime(100);
    expect(buffer.append('a')).toBe('ja');
  });

  it('resets to a single character once the reset window has elapsed', () => {
    const buffer = createTypeaheadBuffer(500);
    buffer.append('j');
    vi.advanceTimersByTime(500);
    expect(buffer.append('a')).toBe('a');
  });

  it('clear() empties the buffer immediately and cancels the pending timer', () => {
    const buffer = createTypeaheadBuffer();
    buffer.append('j');
    buffer.clear();
    expect(buffer.append('a')).toBe('a');
  });
});
