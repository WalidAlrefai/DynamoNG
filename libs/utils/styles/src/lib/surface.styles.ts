/**
 * Small shared style recipes that appeared verbatim in many component
 * `*.styles.ts` files. Plain strings — concatenate or pass through `cn()`.
 */

/**
 * The "eyebrow" heading above an option group or list section — typography only,
 * no padding. Use when the component already applies its own padding (e.g. a
 * header row): Order List, Pick List, Mega Menu.
 */
export const sectionHeadingBaseClass =
  'text-xs font-semibold uppercase tracking-wide text-text-muted';

/**
 * `sectionHeadingBaseClass` plus the standard `px-4 pt-2 pb-1` inset — for a
 * heading that sits directly inside a scrolling list (Select option groups,
 * Listbox).
 */
export const sectionHeadingClass = 'px-4 pt-2 pb-1 ' + sectionHeadingBaseClass;

/**
 * Border + surface + elevation chrome shared by every floating overlay panel
 * (~16 files all carrying an identical `rounded-md border border-border
 * bg-surface-0 shadow-lg`). The consumer adds the z-index layer
 * (`z-overlay-panel`, `z-modal`, …) and any width/scroll constraints itself.
 */
export const overlayPanelClass =
  'rounded-md border border-border bg-surface-0 shadow-lg';
