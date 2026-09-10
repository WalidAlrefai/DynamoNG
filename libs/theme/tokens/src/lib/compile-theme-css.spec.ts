import { describe, expect, it } from 'vitest';
import { compileThemeCss } from './compile-theme-css';
import type { DynamoThemeTokens } from './theme-tokens.types';

const baseTokens: DynamoThemeTokens = {
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
    fontSans: 'ui-sans-serif, system-ui, sans-serif',
    fontMono: 'ui-monospace, monospace',
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
  elevation: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
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

describe('compileThemeCss', () => {
  it('emits a :root block with kebab-cased custom properties for every token', () => {
    const css = compileThemeCss(baseTokens);

    expect(css).toContain(':root {');
    expect(css).toContain('--dg-color-primary: #6366f1;');
    expect(css).toContain('--dg-color-primary-hover: #4f46e5;');
    expect(css).toContain('--dg-radius-sm: 0.25rem;');
    expect(css).toContain('--dg-focus-ring-width: 2px;');
    // Categories added in the Phase-1 token expansion — the compiler is
    // generic, so these must appear without any change to compile-theme-css.ts.
    expect(css).toContain('--dg-spacing-unit: 0.25rem;');
    expect(css).toContain('--dg-typography-font-size-sm: 0.875rem;');
    expect(css).toContain('--dg-typography-weight-medium: 500;');
    expect(css).toContain('--dg-elevation-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);');
    expect(css).toContain('--dg-motion-duration-base: 200ms;');
    expect(css).toContain('--dg-z-index-modal: 1300;');
    expect(css).toContain('--dg-color-surface-300: #d1d5db;');
  });

  it('does not emit a dark block when no dark overrides are provided', () => {
    const css = compileThemeCss(baseTokens);

    expect(css).not.toContain('.dark {');
  });

  it('emits only the overridden tokens under the dark selector', () => {
    const css = compileThemeCss(baseTokens, {
      dark: { color: { surface0: '#0f0f10', textPrimary: '#f9fafb' } },
    });

    expect(css).toContain('.dark {');
    expect(css).toContain('--dg-color-surface-0: #0f0f10;');
    expect(css).toContain('--dg-color-text-primary: #f9fafb;');
    // Unrelated light tokens should not be duplicated into the dark block.
    const darkBlock = css.split('.dark {')[1] ?? '';
    expect(darkBlock).not.toContain('--dg-color-primary:');
  });

  it('respects custom light/dark selectors', () => {
    const css = compileThemeCss(baseTokens, {
      lightSelector: '[data-theme="aura"]',
      darkSelector: '[data-theme="aura-dark"]',
      dark: { color: { surface0: '#0f0f10' } },
    });

    expect(css).toContain('[data-theme="aura"] {');
    expect(css).toContain('[data-theme="aura-dark"] {');
  });

  it('handles an empty dark override object without emitting an empty block', () => {
    const css = compileThemeCss(baseTokens, { dark: {} });

    expect(css).not.toContain('.dark {');
  });
});
