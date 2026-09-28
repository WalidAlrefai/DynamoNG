export type DynamoPanelMenuPart = 'root' | 'row' | 'chevron' | 'group';

/**
 * A panel-menu item triggers an action, unlike Tree's `DynamoTreeNode`
 * (which selects a value) — independently duplicated shape, same
 * "action not a value" distinction Tiered Menu's `DynamoTieredMenuItem` and
 * Menubar's `DynamoMenubarItem` already draw against `DynamoTreeNode`.
 * Deliberately carries no `id` field (matching Tiered Menu/Menubar's own
 * id-less item shape) — PanelMenu tracks expand state by structural path
 * (the chain of child indices from the root) instead of a consumer-supplied
 * id, so nothing here needs to be unique or stable beyond its position.
 */
export interface DynamoPanelMenuItem {
  label: string;
  /** Optional short glyph/text rendered before the label — e.g. a Unicode symbol or emoji. Not connected to `@dynamong/icons` (which only exports one fixed checkmark glyph today, not a general icon-selection system) — same plain-string shape as `@dynamong/menu`'s `DynamoMenuItem.icon`. */
  icon?: string;
  disabled?: boolean;
  children?: DynamoPanelMenuItem[];
  /** Invoked when this item is committed (only meaningful on a leaf — an item with no `children`). */
  command?: () => void;
}
