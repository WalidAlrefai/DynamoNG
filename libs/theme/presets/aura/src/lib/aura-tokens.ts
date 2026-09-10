import type { DynamoThemeTokens, DynamoThemeTokensOverride } from '@dynamong/theme/tokens';

/**
 * The default (light) token values for the "Aura" preset.
 *
 * The `spacing`/`typography`/`elevation`/`motion`/`zIndex` categories are seeded
 * with values equal to today's de-facto Tailwind defaults, so wiring them through
 * the preset is a visual no-op — they exist to become *themeable*, not to change
 * the current look.
 */
export const auraLightTokens: DynamoThemeTokens = {
  color: {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    onPrimary: '#ffffff',
    secondary: '#64748b',
    secondaryHover: '#475569',
    onSecondary: '#ffffff',
    success: '#16a34a',
    successHover: '#15803d',
    onSuccess: '#ffffff',
    info: '#0284c7',
    infoHover: '#0369a1',
    onInfo: '#ffffff',
    warning: '#d97706',
    warningHover: '#b45309',
    onWarning: '#ffffff',
    danger: '#dc2626',
    dangerHover: '#b91c1c',
    onDanger: '#ffffff',
    surface0: '#ffffff',
    surface50: '#f9fafb',
    surface100: '#f3f4f6',
    surface200: '#e5e7eb',
    surface300: '#d1d5db',
    surface700: '#374151',
    surface800: '#1f2937',
    surface900: '#111827',
    textPrimary: '#111827',
    textMuted: '#6b7280',
    textDisabled: '#9ca3af',
    border: '#e5e7eb',
    ring: '#6366f1',
    scrim: 'rgb(0 0 0 / 0.5)',
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  focus: { ringWidth: '2px', ringOffset: '2px' },
  spacing: { unit: '0.25rem' },
  typography: {
    fontSans:
      'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    fontMono:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSizeXs: '0.75rem',
    fontSizeSm: '0.875rem',
    fontSizeBase: '1rem',
    fontSizeLg: '1.125rem',
    lineHeightXs: '1rem',
    lineHeightSm: '1.25rem',
    lineHeightBase: '1.5rem',
    lineHeightLg: '1.75rem',
    weightNormal: '400',
    weightMedium: '500',
    weightSemibold: '600',
  },
  // Equal to Tailwind v4's own default `shadow-sm/md/lg`, so mapping them
  // through the token is a visual no-op until a theme overrides them.
  elevation: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  motion: {
    durationFast: '150ms',
    durationBase: '200ms',
    durationSlow: '300ms',
    easeStandard: 'cubic-bezier(0, 0, 0.2, 1)',
    easeEmphasized: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  zIndex: {
    dropdown: '1000',
    overlayPanel: '1100',
    drawer: '1200',
    modal: '1300',
    popover: '1400',
    toast: '1500',
    tooltip: '1600',
  },
};

/** Token overrides applied under `.dark` for the "Aura" preset. */
export const auraDarkTokens: DynamoThemeTokensOverride = {
  color: {
    primary: '#818cf8',
    primaryHover: '#a5b4fc',
    onPrimary: '#1e1b4b',
    success: '#4ade80',
    successHover: '#86efac',
    info: '#38bdf8',
    infoHover: '#7dd3fc',
    warning: '#fbbf24',
    warningHover: '#fcd34d',
    danger: '#f87171',
    dangerHover: '#fca5a5',
    surface0: '#0f0f10',
    surface50: '#18181b',
    surface100: '#27272a',
    surface200: '#3f3f46',
    surface300: '#52525b',
    surface700: '#d4d4d8',
    surface800: '#e4e4e7',
    surface900: '#fafafa',
    textPrimary: '#f9fafb',
    textMuted: '#a1a1aa',
    textDisabled: '#71717a',
    border: '#3f3f46',
    scrim: 'rgb(0 0 0 / 0.65)',
  },
  elevation: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.55), 0 4px 6px -4px rgb(0 0 0 / 0.55)',
  },
};
