import type { DynamoTableColumn } from './table.types';

/**
 * Case-insensitive substring predicate for one row against the already
 * trimmed+lowercased `query`. Checks every column with `filterable !==
 * false` (the default, when the property is omitted, is "included" — the
 * opposite default polarity from `sortable`, which excludes by omission)
 * and matches if ANY of them contains `query` as a substring. Reads each
 * column's value via the caller-supplied `cellValue` accessor — i.e.
 * `cell()`'s formatted output when present, else the raw `field` value —
 * deliberately DIFFERENT from `table.sort.ts`'s default accessor, which
 * always reads the raw `field` value and never `cell()`. Filtering matches
 * what's conceptually shown to the user; sorting orders by the real
 * underlying value. Neither ever reads `cellTemplate`.
 */
function rowMatches<TRow>(
  row: TRow,
  columns: readonly DynamoTableColumn<TRow>[],
  query: string,
  cellValue: (row: TRow, column: DynamoTableColumn<TRow>) => unknown,
): boolean {
  return columns
    .filter((column) => column.filterable !== false)
    .some((column) =>
      String(cellValue(row, column)).toLowerCase().includes(query),
    );
}

/**
 * Returns a new filtered array (never mutates `rows`, which backs a
 * component `input()` — same contract as `sortRows`). Returns `rows`
 * unchanged (same reference) when `query` is blank/whitespace-only after
 * trimming — no defensive copy needed for the unfiltered case.
 */
export function filterRows<TRow>(
  rows: readonly TRow[],
  columns: readonly DynamoTableColumn<TRow>[],
  query: string,
  cellValue: (row: TRow, column: DynamoTableColumn<TRow>) => unknown,
): readonly TRow[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return rows;
  return rows.filter((row) => rowMatches(row, columns, trimmed, cellValue));
}
