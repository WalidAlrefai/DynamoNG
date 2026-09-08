export type DynamoTieredMenuPart = 'root' | 'trigger' | 'panel' | 'item';

/** Root panel position — the same vocabulary as `@dynamong/menu`'s `DynamoMenuPosition`. */
export type DynamoTieredMenuPosition = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

/**
 * A menu item triggers an action, unlike Cascade Select's `DynamoTreeNode`
 * (which selects a value) — a deliberately separate, self-contained shape
 * rather than reusing `@dynamong/tree`'s node type.
 */
export interface DynamoTieredMenuItem {
  label: string;
  disabled?: boolean;
  children?: DynamoTieredMenuItem[];
  /** Invoked when this item is committed (only meaningful on a leaf — an item with no `children`). */
  command?: () => void;
}
