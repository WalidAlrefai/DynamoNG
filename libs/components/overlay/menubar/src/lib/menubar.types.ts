export type DynamoMenubarPart =
  'root' | 'bar' | 'start' | 'end' | 'item' | 'panel' | 'row';

/** Level-0 dropdown corner — the same vocabulary as `@dynamong/menu`'s `DynamoMenuPosition` and `@dynamong/tiered-menu`'s `DynamoTieredMenuPosition`. */
export type DynamoMenubarPosition =
  'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

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
  /** Optional short glyph/text rendered before the label — e.g. a Unicode symbol or emoji. Not connected to `@dynamong/icons` (which only exports one fixed checkmark glyph today, not a general icon-selection system) — same plain-string shape as `@dynamong/menu`'s `DynamoMenuItem.icon`. */
  icon?: string;
  disabled?: boolean;
  /** When explicitly `false`, this item is omitted from render AND keyboard navigation entirely (not just dimmed, unlike `disabled`). Defaults to visible when omitted. */
  visible?: boolean;
  /** Display-only keyboard-shortcut hint text (e.g. `"⌘K"`), rendered as trailing, `aria-hidden` content. Purely cosmetic — registers no actual key binding. */
  shortcut?: string;
  /** A small trailing badge/count, rendered via `@dynamong/badge`. Purely cosmetic — no keyboard/command semantics. */
  badge?: string | number;
  children?: DynamoMenubarEntry[];
  /** Invoked when this item is committed (only meaningful on a leaf — an item with no `children`). */
  command?: () => void;
}

/**
 * A non-interactive divider row inside a dropdown/flyout. Scoped to panel
 * content only — never valid at the bar level (`items()` stays
 * `DynamoMenubarItem[]`, not `DynamoMenubarEntry[]`), since a bar is
 * fundamentally a row of clickable roots, not a command list. Mirrors
 * `@dynamong/menu`'s own `DynamoMenuItem.separator` boolean input, adapted
 * to a discriminated-union sentinel entry since Menubar's rows are plain
 * data, not projected directive instances.
 */
export interface DynamoMenubarSeparator {
  separator: true;
}

export type DynamoMenubarEntry = DynamoMenubarItem | DynamoMenubarSeparator;

export function isMenubarSeparator(
  entry: DynamoMenubarEntry,
): entry is DynamoMenubarSeparator {
  return 'separator' in entry && entry.separator === true;
}
