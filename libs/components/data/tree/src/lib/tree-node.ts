import type { DynamoTreeNode } from './tree.types';

/**
 * True when a node should render a chevron and be toggleable — either it
 * already has loaded children, or it's explicitly marked `leaf: false` (has
 * children that haven't been fetched yet; pair with `(nodeExpand)` to load
 * them lazily). A node with no `children` and no explicit `leaf` flag is an
 * ordinary leaf, unchanged from pre-lazy-loading behavior.
 */
export function isTreeNodeExpandable(node: DynamoTreeNode): boolean {
  return (node.children?.length ?? 0) > 0 || node.leaf === false;
}
