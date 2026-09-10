/**
 * Keyboard-focus ring — a single themeable treatment, replacing the
 * `focus-visible:outline-none ring-2 ring-ring ring-offset-2` recipe that was
 * copy-pasted across ~50 component `*.styles.ts` files.
 *
 * Each constant is a preset `@utility` (defined in
 * `@dynamong/theme/tailwind-preset/preset.css`) that paints a two-layer
 * box-shadow driven by `--dg-focus-ring-width` / `--dg-focus-ring-offset` /
 * `--dg-color-ring`. Themeable in one place; no per-component ring geometry.
 */

/** Element is itself the focus target. */
export const focusRingClass = 'dg-focus-ring';

/** Wrapper whose focusable element is a descendant (e.g. the Select trigger). */
export const focusRingWithinClass = 'dg-focus-ring-within';

/** Element styled off a preceding sibling `.peer` input's focus (e.g. the Checkbox box). */
export const focusRingPeerClass = 'dg-focus-ring-peer';

/**
 * Add alongside `focusRingClass` / `focusRingWithinClass` on an **invalid** form
 * field so the ring is tinted with the danger colour instead of the accent.
 * Sets the `--dg-focus-ring-color` custom property the `@utility` reads.
 */
export const focusRingInvalidClass = '[--dg-focus-ring-color:var(--color-danger)]';
