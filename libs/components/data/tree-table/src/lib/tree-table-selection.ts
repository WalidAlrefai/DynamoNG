import type { DynamoTreeTableNode } from './tree-table.types';

// Independently duplicated from Tree's own tree-selection.ts (not
// importable — TreeTable and Tree are both tier:1, and same-tier
// dependencies are forbidden by @nx/enforce-module-boundaries) — same
// algorithm, retyped to DynamoTreeTableNode<TRow> in place of
// DynamoTreeNode. See tree-table.ts's own class doc comment for the
// identical reasoning already applied to its sort logic.

export type DynamoTreeTableCheckState = 'checked' | 'unchecked' | 'indeterminate';

/**
 * A node's displayed checked state is always derived from its descendants
 * for non-leaf nodes — never stored directly — so it can never drift out of
 * sync with the leaves that make it up.
 */
export function computeNodeCheckState<TRow>(
  node: DynamoTreeTableNode<TRow>,
  selectedIds: ReadonlySet<string>,
): DynamoTreeTableCheckState {
  if (!node.children?.length) {
    return selectedIds.has(node.id) ? 'checked' : 'unchecked';
  }
  const states = node.children.map((child) =>
    computeNodeCheckState(child, selectedIds),
  );
  if (states.every((state) => state === 'checked')) {
    return 'checked';
  }
  if (states.every((state) => state === 'unchecked')) {
    return 'unchecked';
  }
  return 'indeterminate';
}

/**
 * Whether toggling `node` should check (true) or uncheck (false) its
 * subtree. Deliberately ignores disabled descendants entirely (rather than
 * reusing `computeNodeCheckState`'s all-descendants view): a disabled
 * descendant can never be cascaded into a checked state, so counting it
 * against "are we fully checked?" would make a branch with any disabled,
 * unchecked descendant permanently indeterminate — clicking its checkbox
 * would then always decide to check, since it could never read as fully
 * `'checked'`, leaving no way to cascade-uncheck the enabled descendants
 * that *can* change. Only the enabled leaves' current state should drive
 * this decision.
 */
export function shouldCascadeCheck<TRow>(
  node: DynamoTreeTableNode<TRow>,
  selectedIds: ReadonlySet<string>,
): boolean {
  const enabledLeafStates: boolean[] = [];
  const walk = (current: DynamoTreeTableNode<TRow>) => {
    if (current.disabled) {
      return;
    }
    if (!current.children?.length) {
      enabledLeafStates.push(selectedIds.has(current.id));
      return;
    }
    current.children.forEach(walk);
  };
  walk(node);
  return enabledLeafStates.length === 0 || !enabledLeafStates.every(Boolean);
}

/**
 * Every id in `node`'s own subtree (including itself) whose checked state
 * changes together when `node` is toggled. Disabled descendants are
 * excluded so a cascading check/uncheck never silently flips a disabled
 * node's own state.
 */
export function collectCascadeIds<TRow>(node: DynamoTreeTableNode<TRow>): string[] {
  const ids: string[] = [];
  const walk = (current: DynamoTreeTableNode<TRow>) => {
    if (current.disabled) {
      return;
    }
    ids.push(current.id);
    current.children?.forEach(walk);
  };
  walk(node);
  return ids;
}
