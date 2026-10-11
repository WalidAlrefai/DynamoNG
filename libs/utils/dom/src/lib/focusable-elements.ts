const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Returns every focusable descendant of `container`, in DOM order. */
export function getFocusableElements(container: ParentNode): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
}

// Same tag/disabled rules as FOCUSABLE_SELECTOR, but the `[tabindex]` clause
// doesn't exclude `tabindex="-1"` — a roving-tabindex widget (e.g. Toolbar)
// deliberately cycles its own managed items through `-1` ("not the current
// stop," not "permanently unfocusable") and needs to find them again on the
// next move, unlike getFocusableElements's own "find the one real target"
// use case, which wants to skip anything already roving-managed elsewhere.
const ROVING_TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([disabled])',
].join(',');

/**
 * Returns every descendant of `container` a roving-tabindex widget should
 * manage as a tab stop, in DOM order — includes elements already set to
 * `tabindex="-1"`, unlike `getFocusableElements`. See that function's own
 * doc comment for why they differ.
 */
export function getRovingTabbableElements(
  container: ParentNode,
): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(ROVING_TABBABLE_SELECTOR),
  );
}
