import { describe, expect, it } from 'vitest';
import { filterTree } from './tree.filter';
import type { DynamoTreeNode } from './tree.types';

// docs (no match)
//   ├─ resume (matches "pdf")
//   └─ cover (matches "pdf")
// photos (no match)
//   ├─ vacation (no match)
//   │   ├─ beach (matches "jpg")
//   │   └─ mountain (no match)
//   └─ family (no match)
// notes (no match, leaf)
function sampleNodes(): DynamoTreeNode[] {
  return [
    {
      id: 'docs',
      label: 'docs',
      children: [
        { id: 'resume', label: 'resume.pdf' },
        { id: 'cover', label: 'cover.pdf' },
      ],
    },
    {
      id: 'photos',
      label: 'photos',
      children: [
        {
          id: 'vacation',
          label: 'vacation',
          children: [
            { id: 'beach', label: 'beach.jpg' },
            { id: 'mountain', label: 'mountain.png' },
          ],
        },
        { id: 'family', label: 'family.png' },
      ],
    },
    { id: 'notes', label: 'notes.txt' },
  ];
}

describe('filterTree', () => {
  it('returns the same array reference for a blank query', () => {
    const nodes = sampleNodes();
    expect(filterTree(nodes, '')).toBe(nodes);
  });

  it('returns the same array reference for a whitespace-only query', () => {
    const nodes = sampleNodes();
    expect(filterTree(nodes, '   ')).toBe(nodes);
  });

  it('keeps only branches leading to a match, dropping siblings that lead nowhere', () => {
    const result = filterTree(sampleNodes(), 'pdf');

    expect(result.map((n) => n.id)).toEqual(['docs']);
    expect(result[0]?.children?.map((c) => c.id)).toEqual(['resume', 'cover']);
  });

  it('keeps a deeply-nested match with its full ancestor chain, pruning non-matching aunts/uncles', () => {
    const result = filterTree(sampleNodes(), 'beach');

    expect(result.map((n) => n.id)).toEqual(['photos']);
    const vacation = result[0]?.children?.find((c) => c.id === 'vacation');
    expect(vacation?.children?.map((c) => c.id)).toEqual(['beach']);
    // "family" (photos' other child) doesn't match and has no matching
    // descendant, so it's pruned even though its sibling "vacation" is kept.
    expect(result[0]?.children?.map((c) => c.id)).toEqual(['vacation']);
  });

  it('keeps a matching branch’s entire original subtree unpruned, not re-filtering its children', () => {
    const result = filterTree(sampleNodes(), 'photos');

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
    expect(filterTree(sampleNodes(), '  NOTES  ').map((n) => n.id)).toEqual([
      'notes',
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterTree(sampleNodes(), 'zzz')).toEqual([]);
  });

  it('never mutates the input nodes', () => {
    const nodes = sampleNodes();
    const original = JSON.parse(JSON.stringify(nodes));
    filterTree(nodes, 'pdf');
    expect(nodes).toEqual(original);
  });

  it('a leaf node with no children key matches or is dropped, never crashing on missing children', () => {
    expect(filterTree(sampleNodes(), 'notes.txt').map((n) => n.id)).toEqual([
      'notes',
    ]);
    expect(filterTree(sampleNodes(), 'nonexistent-leaf')).toEqual([]);
  });
});
