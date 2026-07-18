import type { DynamoThemeTokens, DynamoThemeTokensOverride } from '@dynamong/theme/tokens';

/** The default (light) token values for the "Aura" preset. */
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
    surface700: '#374151',
    surface800: '#1f2937',
    surface900: '#111827',
    textPrimary: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    ring: '#6366f1',
  },
  radius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
  focus: { ringWidth: '2px', ringOffset: '2px' },
};

/** Token overrides applied under `.dark` for the "Aura" preset. */
export const auraDarkTokens: DynamoThemeTokensOverride = {
  color: {
    primary: '#818cf8',
    primaryHover: '#a5b4fc',
    onPrimary: '#1e1b4b',
    surface0: '#0f0f10',
    surface50: '#18181b',
    surface100: '#27272a',
    surface200: '#3f3f46',
    surface700: '#d4d4d8',
    surface800: '#e4e4e7',
    surface900: '#fafafa',
    textPrimary: '#f9fafb',
    textMuted: '#a1a1aa',
    border: '#3f3f46',
  },
};
