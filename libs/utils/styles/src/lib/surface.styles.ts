/**
 * Small shared style recipes that appeared verbatim in many component
 * `*.styles.ts` files. Plain strings — concatenate or pass through `cn()`.
 */

/**
 * The "eyebrow" heading above an option group or list section — was duplicated
 * in Listbox, Order List, Pick List, Select, and Mega Menu.
 */
export const sectionHeadingClass =
  'px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted';

/**
 * Border + surface + elevation chrome shared by every floating overlay panel
 * (~16 files all carrying an identical `rounded-md border border-border
 * bg-surface-0 shadow-lg`). The consumer adds the z-index layer
 * (`z-overlay-panel`, `z-modal`, …) and any width/scroll constraints itself.
 */
export const overlayPanelClass =
  'rounded-md border border-border bg-surface-0 shadow-lg';
