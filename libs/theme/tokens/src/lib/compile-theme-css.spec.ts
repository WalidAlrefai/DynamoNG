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

describe('compileThemeCss', () => {
  it('emits a :root block with kebab-cased custom properties for every token', () => {
    const css = compileThemeCss(baseTokens);

    expect(css).toContain(':root {');
    expect(css).toContain('--dg-color-primary: #6366f1;');
    expect(css).toContain('--dg-color-primary-hover: #4f46e5;');
    expect(css).toContain('--dg-radius-sm: 0.25rem;');
    expect(css).toContain('--dg-focus-ring-width: 2px;');
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
