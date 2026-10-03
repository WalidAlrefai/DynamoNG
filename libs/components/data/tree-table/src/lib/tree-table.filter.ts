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
 * Case-insensitive substring predicate for one column filter's `value`
 * against `row`, or `column.columnFilter.predicate` when supplied.
 */
function columnMatches<TRow>(
  row: TRow,
  column: DynamoTreeTableColumn<TRow>,
  value: unknown,
  cellValue: (row: TRow, column: DynamoTreeTableColumn<TRow>) => unknown,
): boolean {
  const predicate = column.columnFilter?.predicate;
  if (predicate) return predicate(row, value);
  return String(cellValue(row, column))
    .toLowerCase()
    .includes(String(value).trim().toLowerCase());
}

/**
 * Recursively prunes `nodes` to those that either match (the global query
 * AND every active column filter) themselves, or have a descendant that
 * does — a flat per-node filter (like Table's) would hide a matching
 * grandchild behind its now-excluded, non-matching parent, defeating the
 * point of searching a hierarchy.
 *
 * Global and per-column filtering are combined into ONE predicate and the
 * tree is pruned in a SINGLE pass — not composed as two sequential
 * `filterTree` calls the way Table composes its own two flat-array
 * filters. Table's two-pass composition is safe there because
 * `filter(filter(rows, a), b)` is algebraically identical to
 * `rows.filter(r => a(r) && b(r))` for a flat array — but this function's
 * hierarchy-preservation (a match keeps its whole subtree, see below)
 * breaks that equivalence: running a second prune over an
 * already-ancestor-preserved result can't distinguish "survived because it
 * genuinely matched" from "survived merely as a kept match's ancestor,"
 * which can let a node through that satisfies NEITHER filter on its own.
 * Combining into one predicate and pruning once avoids this entirely.
 *
 * A node that matches keeps its ENTIRE original subtree unpruned (a match
 * is shown with its full context beneath it, not re-filtered) — the same
 * asymmetry a file-search "show this folder's contents because the folder
 * itself matched" UX expects. A node that doesn't match but has a
 * matching descendant keeps only the recursively-filtered children,
 * dropping siblings that lead nowhere. Never mutates `nodes` (which backs
 * a component `input()`) or the nodes themselves; returns `nodes` (same
 * reference) unchanged when there is no active query or column filter.
 */
export function filterTree<TRow>(
  nodes: readonly DynamoTreeTableNode<TRow>[],
  columns: readonly DynamoTreeTableColumn<TRow>[],
  query: string,
  columnFilters: Readonly<Record<string, unknown>>,
  cellValue: (row: TRow, column: DynamoTreeTableColumn<TRow>) => unknown,
): readonly DynamoTreeTableNode<TRow>[] {
  const trimmed = query.trim().toLowerCase();
  const activeColumnFilters = columns.filter((column) => {
    const value = columnFilters[column.field];
    return value !== undefined && value !== null && value !== '';
  });
  if (!trimmed && activeColumnFilters.length === 0) return nodes;

  const matches = (row: TRow): boolean => {
    if (trimmed && !rowMatches(row, columns, trimmed, cellValue)) {
      return false;
    }
    return activeColumnFilters.every((column) =>
      columnMatches(row, column, columnFilters[column.field], cellValue),
    );
  };

  const filterNode = (
    node: DynamoTreeTableNode<TRow>,
  ): DynamoTreeTableNode<TRow> | null => {
    if (matches(node.data)) return node;
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
