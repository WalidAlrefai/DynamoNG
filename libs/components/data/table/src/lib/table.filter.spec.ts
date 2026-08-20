import { describe, expect, it } from 'vitest';
import { filterRows } from './table.filter';
import type { DynamoTableColumn } from './table.types';

interface Row {
  name: string;
  age: number;
  status: string;
}

const nameColumn: DynamoTableColumn<Row> = { field: 'name', header: 'Name' };
const ageColumn: DynamoTableColumn<Row> = { field: 'age', header: 'Age' };
const statusColumn: DynamoTableColumn<Row> = {
  field: 'status',
  header: 'Status',
  filterable: false,
};
const columns = [nameColumn, ageColumn, statusColumn];

const cellValue = (row: Row, column: DynamoTableColumn<Row>): unknown =>
  column.cell
    ? column.cell(row)
    : (row as unknown as Record<string, unknown>)[column.field];

const rows: Row[] = [
  { name: 'Ada Lovelace', age: 40, status: 'active' },
  { name: 'Bea Smith', age: 30, status: 'invited' },
];

describe('filterRows', () => {
  it('returns the same array reference for a blank query', () => {
    expect(filterRows(rows, columns, '', cellValue)).toBe(rows);
  });

  it('returns the same array reference for a whitespace-only query', () => {
    expect(filterRows(rows, columns, '   ', cellValue)).toBe(rows);
  });

  it('matches case-insensitively', () => {
    expect(filterRows(rows, columns, 'ADA', cellValue)).toEqual([rows[0]]);
  });

  it('matches a substring anywhere in a stringified field, across columns', () => {
    expect(filterRows(rows, columns, '30', cellValue)).toEqual([rows[1]]);
  });

  it('matches when ANY filterable column matches, not requiring all', () => {
    expect(filterRows(rows, columns, 'smith', cellValue)).toEqual([rows[1]]);
  });

  it('excludes a column with filterable: false from the search', () => {
    // Only `statusColumn` (filterable: false) contains "active"/"invited"
    expect(filterRows(rows, columns, 'invited', cellValue)).toEqual([]);
  });

  it('trims leading/trailing whitespace before matching', () => {
    expect(filterRows(rows, columns, '  ada  ', cellValue)).toEqual([rows[0]]);
  });

  it('reads a column value through cell() when present, not just the raw field', () => {
    const prefixColumn: DynamoTableColumn<Row> = {
      field: 'name',
      header: 'Name',
      cell: () => 'PREFIX-MATCH',
    };

    expect(filterRows(rows, [prefixColumn], 'prefix-match', cellValue)).toEqual(
      rows,
    );
  });

  it('never reads cellTemplate for matching (cellValue never consults it)', () => {
    const templatedColumn: DynamoTableColumn<Row> = {
      ...nameColumn,
      cellTemplate: {} as never,
    };

    expect(filterRows(rows, [templatedColumn], 'ada', cellValue)).toEqual([
      rows[0],
    ]);
  });

  it('returns an empty array when no row matches', () => {
    expect(filterRows(rows, columns, 'zzz', cellValue)).toEqual([]);
  });

  it('never mutates the input array', () => {
    const original = [...rows];
    filterRows(rows, columns, 'ada', cellValue);
    expect(rows).toEqual(original);
  });
});
