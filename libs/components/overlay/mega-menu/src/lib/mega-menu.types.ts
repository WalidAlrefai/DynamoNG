/**
 * A single link inside a mega-panel column. Fires `command` when committed;
 * independently defined (not reusing `@dynamong/menu`'s `DynamoMenuItem`),
 * matching the codebase's "each overlay-menu component keeps its own item
 * type" precedent (Menubar, Tiered Menu, Context Menu all do the same).
 */
export interface DynamoMegaMenuLink {
  label: string;
  /** Optional short glyph/text rendered before the label — e.g. a Unicode symbol or emoji. Not connected to `@dynamong/icons` (which only exports one fixed checkmark glyph today, not a general icon-selection system) — same plain-string shape as `@dynamong/menu`'s `DynamoMenuItem.icon`. */
  icon?: string;
  disabled?: boolean;
  command?: () => void;
}

/** One column of links within a root item's mega panel, with an optional heading. */
export interface DynamoMegaMenuColumn {
  header?: string;
  items: DynamoMegaMenuLink[];
}

/**
 * A top-level bar item. When `columns` is present and non-empty the item
 * opens a mega panel; otherwise it is a leaf that fires `command` directly.
 */
export interface DynamoMegaMenuItem {
  label: string;
  /** Optional short glyph/text rendered before the label — e.g. a Unicode symbol or emoji. Not connected to `@dynamong/icons` (which only exports one fixed checkmark glyph today, not a general icon-selection system) — same plain-string shape as `@dynamong/menu`'s `DynamoMenuItem.icon`. */
  icon?: string;
  disabled?: boolean;
  columns?: DynamoMegaMenuColumn[];
  command?: () => void;
}

export type DynamoMegaMenuOrientation = 'horizontal' | 'vertical';

export type DynamoMegaMenuPart =
  | 'root'
  | 'bar'
  | 'start'
  | 'end'
  | 'item'
  | 'panel'
  | 'column'
  | 'columnHeader'
  | 'link';
