import type {
  DynamoTreeTableColumn,
  DynamoTreeTableNode,
} from './tree-table.types';

/**
 * Case-insensitive substring predicate for one row against the already
 * trimmed+lowercased `query` — independently duplicated from Table's own
 * `table.filter.ts` `rowMatches` (not exported from `@dynamong/table`'s
 * `index.ts` regardless, same reason TreeTable already duplicates its sort
 * comparator). Checks every column with `filterable !== false` (the
 * default, when omitted, is "included") and matches if ANY of them
 * contains `query` as a substring.
 */
function rowMatches<TRow>(
  row: TRow,
  columns: readonly DynamoTreeTableColumn<TRow>[],
  query: string,
  cellValue: (row: TRow, column: DynamoTreeTableColumn<TRow>) => unknown,
): boolean {
  return columns
    .filter((column) => column.filterable !== false)
    .some((column) =>
      String(cellValue(row, column)).toLowerCase().includes(query),
    );
}

/**
 * Recursively prunes `nodes` to those that either match `query` themselves
 * or have a descendant that does — a flat per-node filter (like Table's)
 * would hide a matching grandchild behind its now-excluded, non-matching
 * parent, defeating the point of searching a hierarchy.
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
export function filterTree<TRow>(
  nodes: readonly DynamoTreeTableNode<TRow>[],
  columns: readonly DynamoTreeTableColumn<TRow>[],
  query: string,
  cellValue: (row: TRow, column: DynamoTreeTableColumn<TRow>) => unknown,
): readonly DynamoTreeTableNode<TRow>[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return nodes;

  const filterNode = (
    node: DynamoTreeTableNode<TRow>,
  ): DynamoTreeTableNode<TRow> | null => {
    if (rowMatches(node.data, columns, trimmed, cellValue)) return node;
    const filteredChildren = node.children
      ?.map(filterNode)
      .filter((child): child is DynamoTreeTableNode<TRow> => child !== null);
    if (!filteredChildren || filteredChildren.length === 0) return null;
    return { ...node, children: filteredChildren };
  };

  return nodes
    .map(filterNode)
    .filter((node): node is DynamoTreeTableNode<TRow> => node !== null);
}
