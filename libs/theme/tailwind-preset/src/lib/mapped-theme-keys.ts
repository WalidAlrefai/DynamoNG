/**
 * The Tailwind `@theme` keys that `preset.css` maps onto `--dg-*` design tokens.
 * Kept in sync with `preset.css` manually; a test asserts the two stay aligned
 * so a forgotten mapping fails CI instead of silently producing an unstyled utility.
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
  '--color-surface-700',
  '--color-surface-800',
  '--color-surface-900',
  '--color-text-primary',
  '--color-text-muted',
  '--color-border',
  '--color-ring',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-full',
] as const;

export type DynamoTailwindThemeKey = (typeof DYNAMO_TAILWIND_THEME_KEYS)[number];
