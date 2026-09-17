import type { DynamoTreeNode } from './tree.types';

/**
 * Recursively prunes `nodes` to those that either match `query` themselves
 * (a case-insensitive substring match against `label`) or have a
 * descendant that does — a flat per-node filter (a plain array
 * `.filter()`) would hide a matching grandchild behind its now-excluded,
 * non-matching parent, defeating the point of searching a hierarchy.
 * Independently duplicated from `@dynamong/tree-table`'s own
 * `tree-table.filter.ts#filterTree` (same shape, simplified: a
 * `DynamoTreeNode` has only `label` to match against, not multiple
 * `filterable`-flagged columns, so there's no `columns`/`cellValue`
 * parameter to thread through).
 *
 * A node that matches keeps its ENTIRE original subtree unpruned (a match
 * is shown with its full context beneath it, not re-filtered) — the same
 * asymmetry a file-search "show this folder's contents because the folder
 * itself matched" UX expects. A node that doesn't match but has a
 * matching descendant keeps only the recursively-filtered children,
 * dropping siblings that lead nowhere. Never mutates `nodes` (which backs
 * a component `input()`) or the nodes themselves; returns `nodes` (same
 * reference) unchanged when `query` is blank/whitespace-only.
 */
export function filterTree<TValue>(
  nodes: readonly DynamoTreeNode<TValue>[],
  query: string,
): readonly DynamoTreeNode<TValue>[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return nodes;

  const filterNode = (
    node: DynamoTreeNode<TValue>,
  ): DynamoTreeNode<TValue> | null => {
    if (node.label.toLowerCase().includes(trimmed)) return node;
    const filteredChildren = node.children
      ?.map(filterNode)
      .filter((child): child is DynamoTreeNode<TValue> => child !== null);
    if (!filteredChildren || filteredChildren.length === 0) return null;
    return { ...node, children: filteredChildren };
  };

  return nodes
    .map(filterNode)
    .filter((node): node is DynamoTreeNode<TValue> => node !== null);
}
