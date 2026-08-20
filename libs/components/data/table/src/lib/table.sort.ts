import type { DynamoTableColumn } from './table.types';

export type DynamoTableSortDirection = 'asc' | 'desc';

/**
 * Default per-value comparator for columns without a custom `sortFn`.
 * Precedence: Date > number > boolean > locale-aware, numeric-sensitive
 * string compare for everything else.
 */
export function compareValues(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean')
    return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function defaultAccessor<TRow>(
  column: DynamoTableColumn<TRow>,
): (row: TRow) => unknown {
  return (row: TRow) => (row as Record<string, unknown>)[column.field];
}

/**
 * Builds a full a/b comparator for one column+direction. Reads the raw
 * `field` value off the row — NEVER `column.cell` — so a column can format
 * a value for display (e.g. a Date -> "Aug 19, 2026") while still sorting
 * by the real underlying value instead of the formatted string.
 * null/undefined values always sort last regardless of direction (applied
 * only to the built-in default accessor path — a custom `sortFn` is used
 * as-is, just negated for descending).
 */
export function buildComparator<TRow>(
  column: DynamoTableColumn<TRow>,
  direction: DynamoTableSortDirection,
): (a: TRow, b: TRow) => number {
  if (column.sortFn) {
    const base = column.sortFn;
    return direction === 'asc' ? base : (a, b) => -base(a, b);
  }
  const accessor = defaultAccessor(column);
  return (a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    const aNil = va === null || va === undefined;
    const bNil = vb === null || vb === undefined;
    if (aNil && bNil) return 0;
    if (aNil) return 1;
    if (bNil) return -1;
    const cmp = compareValues(va, vb);
    return direction === 'asc' ? cmp : -cmp;
  };
}

/**
 * Returns a new sorted array (never mutates `rows`, which backs a
 * component `input()`). Returns `rows` unchanged (same reference) when
 * `column`/`direction` is null — no defensive copy needed for the
 * unsorted case.
 */
export function sortRows<TRow>(
  rows: readonly TRow[],
  column: DynamoTableColumn<TRow> | undefined,
  direction: DynamoTableSortDirection | null,
): readonly TRow[] {
  if (!column || !direction) return rows;
  return [...rows].sort(buildComparator(column, direction));
}
