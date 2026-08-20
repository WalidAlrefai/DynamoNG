import { describe, expect, it } from 'vitest';
import { buildPaginationRange } from './pagination-range';

describe('buildPaginationRange', () => {
  it('returns an empty array for zero total pages', () => {
    expect(buildPaginationRange(1, 0, 5)).toEqual([]);
  });

  it('returns every page, unwindowed, when total fits within maxVisible', () => {
    expect(buildPaginationRange(1, 4, 5)).toEqual([1, 2, 3, 4]);
    expect(buildPaginationRange(3, 5, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('windows around the current page, with a leading and trailing ellipsis', () => {
    expect(buildPaginationRange(13, 25, 5)).toEqual([
      1,
      'ellipsis',
      12,
      13,
      14,
      'ellipsis',
      25,
    ]);
  });

  it('omits the leading ellipsis when the window starts adjacent to page 1', () => {
    expect(buildPaginationRange(1, 25, 5)).toEqual([
      1,
      2,
      3,
      4,
      'ellipsis',
      25,
    ]);
    expect(buildPaginationRange(2, 25, 5)).toEqual([
      1,
      2,
      3,
      4,
      'ellipsis',
      25,
    ]);
  });

  it('omits the trailing ellipsis when the window ends adjacent to the last page', () => {
    expect(buildPaginationRange(25, 25, 5)).toEqual([
      1,
      'ellipsis',
      22,
      23,
      24,
      25,
    ]);
    expect(buildPaginationRange(24, 25, 5)).toEqual([
      1,
      'ellipsis',
      22,
      23,
      24,
      25,
    ]);
  });

  it('always includes page 1 and the last page even at extreme maxVisible values', () => {
    const range = buildPaginationRange(50, 100, 5);
    expect(range[0]).toBe(1);
    expect(range[range.length - 1]).toBe(100);
  });

  it('floors maxVisible at 5 so a caller-supplied tiny value cannot collapse the window below usefulness', () => {
    expect(buildPaginationRange(13, 25, 1)).toEqual(
      buildPaginationRange(13, 25, 5),
    );
  });

  it('never produces two consecutive ellipsis entries or a gap larger than one skipped page', () => {
    for (let total = 6; total <= 30; total++) {
      for (let current = 1; current <= total; current++) {
        const range = buildPaginationRange(current, total, 5);
        const numbers = range.filter(
          (item): item is number => item !== 'ellipsis',
        );
        expect(new Set(numbers).size).toBe(numbers.length);
        for (let i = 0; i < numbers.length - 1; i++) {
          const gap = (numbers[i + 1] as number) - (numbers[i] as number);
          expect(gap).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});
