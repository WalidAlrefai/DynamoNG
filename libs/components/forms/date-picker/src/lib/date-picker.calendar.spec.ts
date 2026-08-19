import { describe, expect, it } from 'vitest';
import {
  buildCalendarGrid,
  clampToRange,
  isDateDisabled,
} from './date-picker.calendar';

describe('buildCalendarGrid', () => {
  it('returns exactly 42 consecutive days', () => {
    const days = buildCalendarGrid(new Date(2026, 7, 1), 0);

    expect(days).toHaveLength(42);
    let previous: Date | undefined;
    for (const day of days) {
      if (previous) {
        expect(day.getTime() - previous.getTime()).toBe(24 * 60 * 60 * 1000);
      }
      previous = day;
    }
  });

  it('starts the grid on the 1st itself when the 1st is already the week start', () => {
    // Feb 1 2026 is a Sunday — weekStartsOn=0 means zero leading days.
    const days = buildCalendarGrid(new Date(2026, 1, 1), 0);

    expect(days[0]).toEqual(new Date(2026, 1, 1));
  });

  it('includes leading days from the previous month when the 1st is mid-week', () => {
    // Aug 1 2026 is a Saturday — weekStartsOn=0 means 6 leading July days.
    const days = buildCalendarGrid(new Date(2026, 7, 1), 0);

    expect(days[0]).toEqual(new Date(2026, 6, 26));
    expect(days[6]).toEqual(new Date(2026, 7, 1));
  });

  it('respects a non-default weekStartsOn (Monday)', () => {
    // Sep 1 2026 is a Tuesday — weekStartsOn=1 means 1 leading August day.
    const days = buildCalendarGrid(new Date(2026, 8, 1), 1);

    expect(days[0]).toEqual(new Date(2026, 7, 31));
    expect(days[1]).toEqual(new Date(2026, 8, 1));
  });

  it('respects a non-default weekStartsOn (Saturday)', () => {
    // Aug 1 2026 is a Saturday — weekStartsOn=6 means zero leading days.
    const days = buildCalendarGrid(new Date(2026, 7, 1), 6);

    expect(days[0]).toEqual(new Date(2026, 7, 1));
  });
});

describe('clampToRange', () => {
  const min = new Date(2026, 7, 10);
  const max = new Date(2026, 7, 20);

  it('returns the date unchanged (as startOfDay) when neither min nor max is set', () => {
    expect(
      clampToRange(new Date(2026, 7, 15, 13, 30), undefined, undefined),
    ).toEqual(new Date(2026, 7, 15));
  });

  it('clamps a date before min up to min', () => {
    expect(clampToRange(new Date(2026, 7, 1), min, max)).toEqual(min);
  });

  it('clamps a date after max down to max', () => {
    expect(clampToRange(new Date(2026, 7, 25), min, max)).toEqual(max);
  });

  it('leaves a date exactly on min unchanged (inclusive boundary)', () => {
    expect(clampToRange(min, min, max)).toEqual(min);
  });

  it('leaves a date exactly on max unchanged (inclusive boundary)', () => {
    expect(clampToRange(max, min, max)).toEqual(max);
  });

  it('leaves a date between min and max unchanged', () => {
    const middle = new Date(2026, 7, 15);
    expect(clampToRange(middle, min, max)).toEqual(middle);
  });

  it('only enforces min when max is unset', () => {
    expect(clampToRange(new Date(2026, 7, 1), min, undefined)).toEqual(min);
    expect(clampToRange(new Date(2026, 11, 1), min, undefined)).toEqual(
      new Date(2026, 11, 1),
    );
  });

  it('only enforces max when min is unset', () => {
    expect(clampToRange(new Date(2026, 7, 25), undefined, max)).toEqual(max);
    expect(clampToRange(new Date(2026, 0, 1), undefined, max)).toEqual(
      new Date(2026, 0, 1),
    );
  });

  it('ignores time-of-day on min/max when comparing', () => {
    const minWithTime = new Date(2026, 7, 10, 23, 59);
    expect(clampToRange(new Date(2026, 7, 10, 0, 0), minWithTime, max)).toEqual(
      new Date(2026, 7, 10),
    );
  });
});

describe('isDateDisabled', () => {
  const min = new Date(2026, 7, 10);
  const max = new Date(2026, 7, 20);

  it('is never disabled when neither min nor max is set', () => {
    expect(isDateDisabled(new Date(2026, 0, 1), undefined, undefined)).toBe(
      false,
    );
  });

  it('is disabled before min', () => {
    expect(isDateDisabled(new Date(2026, 7, 9), min, max)).toBe(true);
  });

  it('is disabled after max', () => {
    expect(isDateDisabled(new Date(2026, 7, 21), min, max)).toBe(true);
  });

  it('is not disabled exactly on min or max (inclusive boundary)', () => {
    expect(isDateDisabled(min, min, max)).toBe(false);
    expect(isDateDisabled(max, min, max)).toBe(false);
  });

  it('is not disabled between min and max', () => {
    expect(isDateDisabled(new Date(2026, 7, 15), min, max)).toBe(false);
  });
});
