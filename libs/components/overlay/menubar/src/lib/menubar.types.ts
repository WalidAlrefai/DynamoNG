export type DynamoMenubarPart = 'root' | 'bar' | 'start' | 'end' | 'item' | 'panel' | 'row';

/** Level-0 dropdown corner — the same vocabulary as `@dynamong/menu`'s `DynamoMenuPosition` and `@dynamong/tiered-menu`'s `DynamoTieredMenuPosition`. */
export type DynamoMenubarPosition = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

/**
 * A menubar item triggers an action, unlike Cascade Select's `DynamoTreeNode`
 * (which selects a value). Independently duplicated from
 * `@dynamong/tiered-menu`'s identical-shape `DynamoTieredMenuItem` — this
 * codebase's established "each overlay-menu-family component keeps its own
 * item type" precedent (Tiered Menu itself never reuses `DynamoTreeNode` or
 * `@dynamong/menu`'s `DynamoMenuItem`).
 */
export interface DynamoMenubarItem {
  label: string;
  disabled?: boolean;
  children?: DynamoMenubarItem[];
  /** Invoked when this item is committed (only meaningful on a leaf — an item with no `children`). */
  command?: () => void;
}
