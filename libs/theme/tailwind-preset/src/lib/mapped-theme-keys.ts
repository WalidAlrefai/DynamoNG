/**
 * The Tailwind `@theme` keys that `preset.css` maps onto `--dg-*` design tokens.
 * Kept in sync with `preset.css` manually; `mapped-theme-keys.spec.ts` parses the
 * CSS and asserts the two stay aligned, so a forgotten mapping fails CI instead
 * of silently producing an unstyled utility.
 *
 * `@utility` rules in `preset.css` (the focus ring, the `z-*` layers) are NOT
 * listed here — they are real utilities, not `@theme` scale entries.
 */
export const DYNAMO_TAILWIND_THEME_KEYS = [
  '--color-primary',
  '--color-primary-hover',
  '--color-on-primary',
  '--color-secondary',
  '--color-secondary-hover',
  '--color-on-secondary',
  '--color-success',
  '--color-success-hover',
  '--color-on-success',
  '--color-info',
  '--color-info-hover',
  '--color-on-info',
  '--color-warning',
  '--color-warning-hover',
  '--color-on-warning',
  '--color-danger',
  '--color-danger-hover',
  '--color-on-danger',
  '--color-surface-0',
  '--color-surface-50',
  '--color-surface-100',
  '--color-surface-200',
  '--color-surface-300',
  '--color-surface-700',
  '--color-surface-800',
  '--color-surface-900',
  '--color-text-primary',
  '--color-text-muted',
  '--color-text-disabled',
  '--color-border',
  '--color-ring',
  '--color-scrim',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-full',
  '--spacing',
  '--font-sans',
  '--font-mono',
  '--text-xs',
  '--text-xs--line-height',
  '--text-sm',
  '--text-sm--line-height',
  '--text-base',
  '--text-base--line-height',
  '--text-lg',
  '--text-lg--line-height',
  '--font-weight-normal',
  '--font-weight-medium',
  '--font-weight-semibold',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--ease-standard',
  '--ease-emphasized',
] as const;

export type DynamoTailwindThemeKey =
  (typeof DYNAMO_TAILWIND_THEME_KEYS)[number];
