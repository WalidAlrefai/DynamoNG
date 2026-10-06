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
  /** When explicitly `false`, this link is omitted from render AND keyboard navigation entirely (not just dimmed, unlike `disabled`). Defaults to visible when omitted. */
  visible?: boolean;
  /** Display-only keyboard-shortcut hint text (e.g. `"⌘K"`), rendered as trailing, `aria-hidden` content. Purely cosmetic — registers no actual key binding. */
  shortcut?: string;
  /** A small trailing badge/count, rendered via `@dynamong/badge`. Purely cosmetic — no keyboard/command semantics. */
  badge?: string | number;
  command?: () => void;
}

/**
 * A non-interactive divider row inside a column's own `items`. Scoped to
 * column content only — never valid at the top-level bar (`DynamoMegaMenuItem`
 * has no separator concept, in either orientation), since the bar is
 * fundamentally a row of clickable roots, not a command list. Mirrors
 * `@dynamong/menu`'s own `DynamoMenuItem.separator` boolean input, adapted
 * to a discriminated-union sentinel entry since a column's links are plain
 * data, not projected directive instances.
 */
export interface DynamoMegaMenuLinkSeparator {
  separator: true;
}

export type DynamoMegaMenuLinkEntry =
  DynamoMegaMenuLink | DynamoMegaMenuLinkSeparator;

export function isMegaMenuLinkSeparator(
  entry: DynamoMegaMenuLinkEntry,
): entry is DynamoMegaMenuLinkSeparator {
  return 'separator' in entry && entry.separator === true;
}

/** One column of links within a root item's mega panel, with an optional heading. */
export interface DynamoMegaMenuColumn {
  header?: string;
  items: DynamoMegaMenuLinkEntry[];
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
  /** When explicitly `false`, this bar item is omitted from render AND keyboard navigation entirely (not just dimmed, unlike `disabled`). Defaults to visible when omitted. */
  visible?: boolean;
  /** Display-only keyboard-shortcut hint text (e.g. `"⌘K"`), rendered as trailing, `aria-hidden` content. Purely cosmetic — registers no actual key binding. */
  shortcut?: string;
  /** A small trailing badge/count, rendered via `@dynamong/badge`. Purely cosmetic — no keyboard/command semantics. */
  badge?: string | number;
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
