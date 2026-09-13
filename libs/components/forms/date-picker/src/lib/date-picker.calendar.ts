import {
  addDays,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export type DynamoDatePickerWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Always exactly 42 consecutive days (6 fixed rows x 7 columns) covering
 * `visibleMonth`, so the panel never resizes between 4/5/6-week months.
 */
export function buildCalendarGrid(
  visibleMonth: Date,
  weekStartsOn: DynamoDatePickerWeekday,
): Date[] {
  const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn });
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/** Clamps `date` into the inclusive [min, max] day range, ignoring time-of-day on all three. */
export function clampToRange(
  date: Date,
  min: Date | undefined,
  max: Date | undefined,
): Date {
  const day = startOfDay(date);
  if (min && isBefore(day, startOfDay(min))) return startOfDay(min);
  if (max && isAfter(day, startOfDay(max))) return startOfDay(max);
  return day;
}

/**
 * True when `date` falls outside the inclusive [min, max] day range, matches
 * one of `disabledDates` (by calendar day, ignoring time-of-day), or falls
 * on one of `disabledDays` (0 = Sunday, matching `date-fns`'s own weekday
 * numbering) — e.g. `disabledDays: [0, 6]` blocks weekends.
 */
export function isDateDisabled(
  date: Date,
  min: Date | undefined,
  max: Date | undefined,
  disabledDates: readonly Date[] = [],
  disabledDays: readonly number[] = [],
): boolean {
  const day = startOfDay(date);
  if (min && isBefore(day, startOfDay(min))) return true;
  if (max && isAfter(day, startOfDay(max))) return true;
  if (disabledDays.includes(day.getDay())) return true;
  if (disabledDates.some((disabled) => isSameDay(disabled, day))) return true;
  return false;
}
