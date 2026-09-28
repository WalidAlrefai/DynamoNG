import { describe, expect, it } from 'vitest';
import {
  buildComparator,
  compareValues,
  sortRows,
  sortRowsMulti,
} from './table.sort';
import type { DynamoTableColumn } from './table.types';

interface Row {
  name: string;
  age: number;
  joined: Date;
  active: boolean;
  score: number | null;
}

const nameColumn: DynamoTableColumn<Row> = { field: 'name', header: 'Name' };
const ageColumn: DynamoTableColumn<Row> = { field: 'age', header: 'Age' };
const joinedColumn: DynamoTableColumn<Row> = {
  field: 'joined',
  header: 'Joined',
};
const activeColumn: DynamoTableColumn<Row> = {
  field: 'active',
  header: 'Active',
};
const scoreColumn: DynamoTableColumn<Row> = { field: 'score', header: 'Score' };

function row(overrides: Partial<Row> = {}): Row {
  return {
    name: 'Ada',
    age: 30,
    joined: new Date(2022, 0, 1),
    active: true,
    score: 10,
    ...overrides,
  };
}

describe('compareValues', () => {
  it('compares Dates chronologically', () => {
    const earlier = new Date(2020, 0, 1);
    const later = new Date(2021, 0, 1);
    expect(compareValues(earlier, later)).toBeLessThan(0);
    expect(compareValues(later, earlier)).toBeGreaterThan(0);
  });

  it('compares numbers numerically', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
  });

  it('compares booleans (false before true)', () => {
    expect(compareValues(false, true)).toBeLessThan(0);
  });

  it('compares strings numeric-sensitively ("item2" before "item10")', () => {
    expect(compareValues('item2', 'item10')).toBeLessThan(0);
  });
});

describe('buildComparator', () => {
  it('sorts ascending by default field value', () => {
    const rows = [row({ name: 'Bea' }), row({ name: 'Ada' })];
    rows.sort(buildComparator(nameColumn, 'asc'));
    expect(rows.map((r) => r.name)).toEqual(['Ada', 'Bea']);
  });

  it('sorts descending by negating the ascending comparator', () => {
    const rows = [row({ age: 20 }), row({ age: 40 })];
    rows.sort(buildComparator(ageColumn, 'desc'));
    expect(rows.map((r) => r.age)).toEqual([40, 20]);
  });

  it('sorts by the raw field value, never through `cell`', () => {
    const dateColumnWithDisplayCell: DynamoTableColumn<Row> = {
      ...joinedColumn,
      cell: (r) =>
        new Intl.DateTimeFormat('en', { month: 'short' }).format(r.joined),
    };
    const rows = [
      row({ name: 'April', joined: new Date(2022, 3, 1) }),
      row({ name: 'January', joined: new Date(2022, 0, 1) }),
    ];
    // Alphabetically "April" < "January", but chronologically January comes first —
    // proves the comparator reads `joined` directly, not the formatted `cell` output.
    rows.sort(buildComparator(dateColumnWithDisplayCell, 'asc'));
    expect(rows.map((r) => r.name)).toEqual(['January', 'April']);
  });

  it('sorts null/undefined values last in ascending order', () => {
    const rows = [row({ score: null }), row({ score: 5 }), row({ score: 1 })];
    rows.sort(buildComparator(scoreColumn, 'asc'));
    expect(rows.map((r) => r.score)).toEqual([1, 5, null]);
  });

  it('sorts null/undefined values last in descending order too', () => {
    const rows = [row({ score: null }), row({ score: 5 }), row({ score: 1 })];
    rows.sort(buildComparator(scoreColumn, 'desc'));
    expect(rows.map((r) => r.score)).toEqual([5, 1, null]);
  });

  it('uses a custom sortFn as-is for ascending', () => {
    const column: DynamoTableColumn<Row> = {
      ...activeColumn,
      sortFn: (a, b) => Number(b.active) - Number(a.active),
    };
    const rows = [
      row({ name: 'Inactive', active: false }),
      row({ name: 'Active', active: true }),
    ];
    rows.sort(buildComparator(column, 'asc'));
    expect(rows.map((r) => r.name)).toEqual(['Active', 'Inactive']);
  });

  it('negates a custom sortFn for descending', () => {
    const column: DynamoTableColumn<Row> = {
      ...activeColumn,
      sortFn: (a, b) => Number(b.active) - Number(a.active),
    };
    const rows = [
      row({ name: 'Active', active: true }),
      row({ name: 'Inactive', active: false }),
    ];
    rows.sort(buildComparator(column, 'desc'));
    expect(rows.map((r) => r.name)).toEqual(['Inactive', 'Active']);
  });
});

describe('sortRows', () => {
  const rows: Row[] = [
    row({ name: 'Bea', age: 40 }),
    row({ name: 'Ada', age: 20 }),
  ];

  it('returns the same array reference when column is undefined', () => {
    expect(sortRows(rows, undefined, 'asc')).toBe(rows);
  });

  it('returns the same array reference when direction is null', () => {
    expect(sortRows(rows, nameColumn, null)).toBe(rows);
  });

  it('returns a new array reference when sorted', () => {
    const sorted = sortRows(rows, nameColumn, 'asc');
    expect(sorted).not.toBe(rows);
    expect(sorted.map((r) => r.name)).toEqual(['Ada', 'Bea']);
  });

  it('never mutates the input array', () => {
    const original = [...rows];
    sortRows(rows, nameColumn, 'asc');
    expect(rows).toEqual(original);
  });

  it('is stable — ties preserve original relative order', () => {
    const tied: Row[] = [
      row({ name: 'First', age: 30 }),
      row({ name: 'Second', age: 30 }),
      row({ name: 'Third', age: 30 }),
    ];
    const sorted = sortRows(tied, ageColumn, 'asc');
    expect(sorted.map((r) => r.name)).toEqual(['First', 'Second', 'Third']);
  });
});

describe('sortRowsMulti', () => {
  const columns = [nameColumn, ageColumn];

  it('returns the same array reference when descriptors is empty', () => {
    const rows: Row[] = [row({ name: 'Bea' }), row({ name: 'Ada' })];
    expect(sortRowsMulti(rows, columns, [])).toBe(rows);
  });

  it('never mutates the input array', () => {
    const rows: Row[] = [row({ name: 'Bea' }), row({ name: 'Ada' })];
    const original = [...rows];
    sortRowsMulti(rows, columns, [{ field: 'name', direction: 'asc' }]);
    expect(rows).toEqual(original);
  });

  it('sorts by the primary key alone when there is only one descriptor', () => {
    const rows: Row[] = [row({ name: 'Bea' }), row({ name: 'Ada' })];
    const sorted = sortRowsMulti(rows, columns, [
      { field: 'name', direction: 'asc' },
    ]);
    expect(sorted.map((r) => r.name)).toEqual(['Ada', 'Bea']);
  });

  it('uses the second descriptor only to break ties left by the first', () => {
    const rows: Row[] = [
      row({ name: 'Charlie', age: 30 }),
      row({ name: 'Ada', age: 30 }),
      row({ name: 'Bea', age: 20 }),
    ];
    const sorted = sortRowsMulti(rows, columns, [
      { field: 'age', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ]);
    // Bea (20) sorts first on age alone; Ada/Charlie (both 30) are a tie
    // broken by name — proves the second key never overrides the first.
    expect(sorted.map((r) => r.name)).toEqual(['Bea', 'Ada', 'Charlie']);
  });

  it('skips a descriptor whose field matches no column, without throwing', () => {
    const rows: Row[] = [row({ name: 'Bea' }), row({ name: 'Ada' })];
    const sorted = sortRowsMulti(rows, columns, [
      { field: 'nonexistent', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ]);
    expect(sorted.map((r) => r.name)).toEqual(['Ada', 'Bea']);
  });

  it('returns the same array reference when every descriptor is unmatched', () => {
    const rows: Row[] = [row({ name: 'Bea' }), row({ name: 'Ada' })];
    expect(
      sortRowsMulti(rows, columns, [
        { field: 'nonexistent', direction: 'asc' },
      ]),
    ).toBe(rows);
  });
});
