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

export type DynamoTreePart =
  'root' | 'row' | 'checkbox' | 'label' | 'chevron' | 'group';
