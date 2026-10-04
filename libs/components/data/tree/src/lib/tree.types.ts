export interface DynamoTreeNode<TValue = unknown> {
  id: string;
  label: string;
  value?: TValue;
  children?: DynamoTreeNode<TValue>[];
  disabled?: boolean;
  /** Explicitly marks a node as a branch even with no `children` loaded yet
   *  — pair with `(nodeExpand)` to fetch and patch them in on demand.
   *  Omitted/`true` (or any node with `children`) behaves exactly as
   *  before: expandable only when `children` is non-empty. */
  leaf?: boolean;
  /** Shows a spinner in place of this node's chevron and makes it
   *  non-interactive while true — the consumer's own fetch-in-progress
   *  flag, set/cleared entirely by them; the tree never sets it itself. */
  loading?: boolean;
}

/**
 * `'checkbox'` (default) is the original, always-cascading tri-state
 * checkbox model, unchanged. `'single'`/`'multiple'` are new non-cascading
 * modes (PrimeNG's own three `p-tree` selection modes) that reuse the same
 * `selected: string[]` model — only the write semantics differ: `'single'`
 * replaces (never toggles off on re-click), `'multiple'` toggles plain
 * membership with a bare click (no modifier key required, no cascading).
 */
export type DynamoTreeSelectionMode = 'single' | 'multiple' | 'checkbox';

export type DynamoTreePart =
  | 'root'
  | 'filterWrapper'
  | 'filterInput'
  | 'emptyState'
  | 'tree'
  | 'row'
  | 'chevronButton'
  | 'chevron'
  | 'checkbox'
  | 'label'
  | 'group';

/**
 * Template context handed to `nodeTemplate`, matching Angular's `let node` /
 * `let-x="name"` template-variable conventions — same `$implicit`/explicit-
 * name-alias shape as `DynamoTableCellContext`/`DynamoTreeTableCellContext`.
 * No separate `row`/`data` field the way those have: `DynamoTreeNode` already
 * carries `label`/`value` directly, so `$implicit`/`node` here are a pure
 * alias pair for explicit-name-binding symmetry, not a meaningful split.
 */
export interface DynamoTreeNodeContext<TValue = unknown> {
  /** The node itself. Bind with Angular's implicit shorthand: `let node`. */
  $implicit: DynamoTreeNode<TValue>;
  /** Same value as `$implicit`, available under an explicit name: `let-node="node"`. */
  node: DynamoTreeNode<TValue>;
  depth: number;
  expanded: boolean;
}
