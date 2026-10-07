export type DynamoTieredMenuPart = 'root' | 'trigger' | 'panel' | 'item';

/** Root panel position — the same vocabulary as `@dynamong/menu`'s `DynamoMenuPosition`. */
export type DynamoTieredMenuPosition =
  'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

/**
 * A menu item triggers an action, unlike Cascade Select's `DynamoTreeNode`
 * (which selects a value) — a deliberately separate, self-contained shape
 * rather than reusing `@dynamong/tree`'s node type.
 */
export interface DynamoTieredMenuItem {
  label: string;
  /** Optional short glyph/text rendered before the label — e.g. a Unicode symbol or emoji. Not connected to `@dynamong/icons` (which only exports one fixed checkmark glyph today, not a general icon-selection system) — same plain-string shape as `@dynamong/menu`'s `DynamoMenuItem.icon`. */
  icon?: string;
  disabled?: boolean;
  /** When explicitly `false`, this item is omitted from render AND keyboard navigation entirely (not just dimmed, unlike `disabled`). Defaults to visible when omitted. */
  visible?: boolean;
  /** Display-only keyboard-shortcut hint text (e.g. `"⌘K"`), rendered as trailing, `aria-hidden` content. Purely cosmetic — registers no actual key binding. */
  shortcut?: string;
  /** A small trailing badge/count, rendered via `@dynamong/badge`. Purely cosmetic — no keyboard/command semantics. */
  badge?: string | number;
  children?: DynamoTieredMenuEntry[];
  /** Invoked when this item is committed (only meaningful on a leaf — an item with no `children`). */
  command?: () => void;
  /** Navigates via Angular Router instead of (or alongside) `command` when set. Same shape as RouterLink's own `routerLink` input. Only honored on a leaf entry (no `children`) — a branch always opens its flyout regardless of `routerLink`. */
  routerLink?: string | string[];
  /** Forwarded to RouterLink's own `queryParams` input when `routerLink` is set. */
  queryParams?: Record<string, unknown>;
  /** Forwarded to RouterLink's own `fragment` input when `routerLink` is set. */
  fragment?: string;
}

/**
 * A non-interactive divider row. Unlike Menubar/MegaMenu's bar-level items,
 * Tiered Menu's root IS a dropdown list (not a bar of clickable roots), so
 * separators are valid at every level, including the root `items()` array.
 * Mirrors `@dynamong/menu`'s own `DynamoMenuItem.separator` boolean input,
 * adapted to a discriminated-union sentinel entry since Tiered Menu's rows
 * are plain data, not projected directive instances.
 */
export interface DynamoTieredMenuSeparator {
  separator: true;
}

export type DynamoTieredMenuEntry =
  DynamoTieredMenuItem | DynamoTieredMenuSeparator;

export function isTieredMenuSeparator(
  entry: DynamoTieredMenuEntry,
): entry is DynamoTieredMenuSeparator {
  return 'separator' in entry && entry.separator === true;
}
