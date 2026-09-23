import type { DynamoTreeNode } from '@dynamong/tree';

/** A leaf that matched a filter query, plus the labels of every ancestor
 *  branch above it (root-first), for rendering as secondary path text.
 *  Never includes the leaf's own label. */
export interface DynamoCascadeFilterResult<TValue> {
  node: DynamoTreeNode<TValue>;
  path: string[];
}

/**
 * Flattens `nodes` into every LEAF (a node with no `children`) whose own
 * label, or any ancestor's label, case-insensitively includes `query` —
 * mirrors `filterTree`'s "a matching branch keeps its whole subtree"
 * semantic, but applied to produce a flat leaf list instead of a pruned
 * tree, since CascadeSelect's filtered view is a single flat list, not a
 * re-rendered hierarchy. Synthesizing new flyout levels to show a nested
 * filtered view would need each intermediate level's row DOM element to
 * already exist to anchor a flyout to, which isn't true until that level
 * has actually rendered — the same render-order problem
 * `buildInitialLevels` already ran into and deliberately deferred.
 *
 * A leaf beneath a disabled ancestor branch is always excluded — such a
 * leaf is unreachable today through normal drill-down (`drillInto` refuses
 * to open a disabled branch's flyout at all), so a filtered view must not
 * make it newly reachable. A leaf that is itself `disabled` (with only
 * enabled ancestors) is still included — same as a disabled leaf in a
 * normal, non-filtered level: it renders, inert.
 *
 * Returns `[]` for a blank/whitespace-only query — there is no "browse
 * everything flattened" mode; blank query means filtering is off (see
 * `DynamoCascadeSelect.isFilterActive`).
 */
export function flattenCascadeFilterResults<TValue>(
  nodes: readonly DynamoTreeNode<TValue>[],
  query: string,
): DynamoCascadeFilterResult<TValue>[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const results: DynamoCascadeFilterResult<TValue>[] = [];

  const walk = (
    list: readonly DynamoTreeNode<TValue>[],
    path: string[],
    ancestorMatched: boolean,
  ): void => {
    for (const node of list) {
      const matched =
        ancestorMatched || node.label.toLowerCase().includes(trimmed);
      if (!node.children?.length) {
        // Leaf — included if it or any ancestor matched, regardless of its
        // OWN disabled state (a disabled leaf under enabled ancestors still
        // renders, inert, same as in normal per-level browsing).
        if (matched) {
          results.push({ node, path });
        }
        continue;
      }
      // Branch — a disabled branch's children are structurally unreachable
      // today (drillInto refuses to open it), so never descend into one;
      // this is what keeps a leaf under a disabled ancestor out of results.
      if (node.disabled) {
        continue;
      }
      walk(node.children, [...path, node.label], matched);
    }
  };

  walk(nodes, [], false);
  return results;
}
