import { describe, expect, it } from 'vitest';
import { filterTree } from './tree-table.filter';
import type {
  DynamoTreeTableColumn,
  DynamoTreeTableNode,
} from './tree-table.types';

interface Row {
  name: string;
  status: string;
}

const nameColumn: DynamoTreeTableColumn<Row> = {
  field: 'name',
  header: 'Name',
};
const statusColumn: DynamoTreeTableColumn<Row> = {
  field: 'status',
  header: 'Status',
  filterable: false,
};
const columns = [nameColumn, statusColumn];

const cellValue = (row: Row, column: DynamoTreeTableColumn<Row>): unknown =>
  column.cell
    ? column.cell(row)
    : (row as unknown as Record<string, unknown>)[column.field];

// docs (no match)
//   ├─ resume (matches "pdf")
//   └─ cover (matches "pdf")
// photos (no match)
//   ├─ vacation (no match)
//   │   ├─ beach (matches "jpg")
//   │   └─ mountain (no match)
//   └─ family (no match)
// notes (no match, leaf)
function sampleNodes(): DynamoTreeTableNode<Row>[] {
  return [
    {
      id: 'docs',
      data: { name: 'docs', status: 'active' },
      children: [
        { id: 'resume', data: { name: 'resume.pdf', status: 'active' } },
        { id: 'cover', data: { name: 'cover.pdf', status: 'invited' } },
      ],
    },
    {
      id: 'photos',
      data: { name: 'photos', status: 'active' },
      children: [
        {
          id: 'vacation',
          data: { name: 'vacation', status: 'active' },
          children: [
            { id: 'beach', data: { name: 'beach.jpg', status: 'active' } },
            {
              id: 'mountain',
              data: { name: 'mountain.png', status: 'active' },
            },
          ],
        },
        { id: 'family', data: { name: 'family.png', status: 'active' } },
      ],
    },
    { id: 'notes', data: { name: 'notes.txt', status: 'active' } },
  ];
}

describe('filterTree', () => {
  it('returns the same array reference for a blank query', () => {
    const nodes = sampleNodes();
    expect(filterTree(nodes, columns, '', cellValue)).toBe(nodes);
  });

  it('returns the same array reference for a whitespace-only query', () => {
    const nodes = sampleNodes();
    expect(filterTree(nodes, columns, '   ', cellValue)).toBe(nodes);
  });

  it('keeps only branches leading to a match, dropping siblings that lead nowhere', () => {
    const result = filterTree(sampleNodes(), columns, 'pdf', cellValue);

    expect(result.map((n) => n.id)).toEqual(['docs']);
    expect(result[0]?.children?.map((c) => c.id)).toEqual(['resume', 'cover']);
  });

  it('keeps a deeply-nested match with its full ancestor chain, pruning non-matching aunts/uncles', () => {
    const result = filterTree(sampleNodes(), columns, 'beach', cellValue);

    expect(result.map((n) => n.id)).toEqual(['photos']);
    const vacation = result[0]?.children?.find((c) => c.id === 'vacation');
    expect(vacation?.children?.map((c) => c.id)).toEqual(['beach']);
    // "family" (photos' other child) doesn't match and has no matching
    // descendant, so it's pruned even though its sibling "vacation" is kept.
    expect(result[0]?.children?.map((c) => c.id)).toEqual(['vacation']);
  });

  it('keeps a matching branch’s entire original subtree unpruned, not re-filtering its children', () => {
    const result = filterTree(sampleNodes(), columns, 'photos', cellValue);

    expect(result.map((n) => n.id)).toEqual(['photos']);
    // "photos" itself matches, so ALL of its descendants stay, including
    // ones that don't themselves match "photos".
    expect(result[0]?.children?.map((c) => c.id)).toEqual([
      'vacation',
      'family',
    ]);
    const vacation = result[0]?.children?.find((c) => c.id === 'vacation');
    expect(vacation?.children?.map((c) => c.id)).toEqual(['beach', 'mountain']);
  });

  it('matches case-insensitively and trims whitespace', () => {
    expect(
      filterTree(sampleNodes(), columns, '  NOTES  ', cellValue).map(
        (n) => n.id,
      ),
    ).toEqual(['notes']);
  });

  it('excludes a column with filterable: false from the search', () => {
    // Only status ("invited") would match, but it's filterable: false.
    expect(filterTree(sampleNodes(), columns, 'invited', cellValue)).toEqual(
      [],
    );
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterTree(sampleNodes(), columns, 'zzz', cellValue)).toEqual([]);
  });

  it('never mutates the input nodes', () => {
    const nodes = sampleNodes();
    const original = JSON.parse(JSON.stringify(nodes));
    filterTree(nodes, columns, 'pdf', cellValue);
    expect(nodes).toEqual(original);
  });

  it('a leaf node with no children key matches or is dropped, never crashing on missing children', () => {
    expect(
      filterTree(sampleNodes(), columns, 'notes.txt', cellValue).map(
        (n) => n.id,
      ),
    ).toEqual(['notes']);
    expect(
      filterTree(sampleNodes(), columns, 'nonexistent-leaf', cellValue),
    ).toEqual([]);
  });
});
