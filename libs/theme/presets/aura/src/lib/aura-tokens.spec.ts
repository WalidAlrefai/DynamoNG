import { describe, expect, it } from 'vitest';
import { auraDarkTokens, auraLightTokens } from './aura-tokens';
import { AURA_THEME_CSS } from './aura-theme-css';

/** 6-digit hex, or an `rgb(… / α)` colour for the tokens that carry alpha (scrim). */
const COLOR_VALUE = /^#[0-9a-f]{6}$|^rgb\(/i;
const CSS_LENGTH = /^[\d.]+(rem|px)$|^9999px$/;

describe('auraLightTokens', () => {
  it('defines a valid colour value for every color token', () => {
    for (const [name, value] of Object.entries(auraLightTokens.color)) {
      expect(value, `color.${name}`).toMatch(COLOR_VALUE);
    }
  });

  it('defines every radius token as a CSS length or keyword', () => {
    for (const value of Object.values(auraLightTokens.radius)) {
      expect(value).toMatch(CSS_LENGTH);
    }
  });

  it('defines focus and spacing tokens as CSS lengths', () => {
    expect(auraLightTokens.focus.ringWidth).toMatch(CSS_LENGTH);
    expect(auraLightTokens.focus.ringOffset).toMatch(CSS_LENGTH);
    expect(auraLightTokens.spacing.unit).toMatch(CSS_LENGTH);
  });

  it('defines typography sizes/line-heights as lengths and weights as numeric strings', () => {
    const { typography } = auraLightTokens;
    for (const key of ['fontSizeXs', 'fontSizeSm', 'fontSizeBase', 'fontSizeLg'] as const) {
      expect(typography[key], key).toMatch(CSS_LENGTH);
    }
    for (const key of ['lineHeightXs', 'lineHeightSm', 'lineHeightBase', 'lineHeightLg'] as const) {
      expect(typography[key], key).toMatch(CSS_LENGTH);
    }
    for (const key of ['weightNormal', 'weightMedium', 'weightSemibold'] as const) {
      expect(typography[key], key).toMatch(/^[1-9]00$/);
    }
    expect(typography.fontSans).toContain('sans-serif');
    expect(typography.fontMono).toContain('monospace');
  });

  it('defines every elevation token as a box-shadow value', () => {
    for (const [name, value] of Object.entries(auraLightTokens.elevation)) {
      expect(value, `elevation.${name}`).toMatch(/\d+px .*rgb\(/);
    }
  });

  it('defines motion durations in ms and easings as cubic-bezier curves', () => {
    const { motion } = auraLightTokens;
    for (const key of ['durationFast', 'durationBase', 'durationSlow'] as const) {
      expect(motion[key], key).toMatch(/^\d+ms$/);
    }
    expect(motion.easeStandard).toMatch(/^cubic-bezier\(/);
    expect(motion.easeEmphasized).toMatch(/^cubic-bezier\(/);
  });

  it('defines a strictly increasing integer z-index for each layer', () => {
    const layers = [
      'dropdown',
      'overlayPanel',
      'drawer',
      'modal',
      'popover',
      'toast',
      'tooltip',
    ] as const;
    const values = layers.map((k) => Number(auraLightTokens.zIndex[k]));
    for (const value of values) expect(Number.isInteger(value)).toBe(true);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe('auraDarkTokens', () => {
  it('only overrides tokens that exist on the light token set', () => {
    for (const group of Object.keys(auraDarkTokens) as (keyof typeof auraLightTokens)[]) {
      const overrides = auraDarkTokens[group];
      if (!overrides) continue;
      for (const token of Object.keys(overrides)) {
        expect(auraLightTokens[group]).toHaveProperty(token);
      }
    }
  });
});

describe('AURA_THEME_CSS', () => {
  it('is derived from the token objects, not hand-duplicated', () => {
    expect(AURA_THEME_CSS).toContain(`--dg-color-primary: ${auraLightTokens.color.primary};`);
    expect(AURA_THEME_CSS).toContain(`--dg-spacing-unit: ${auraLightTokens.spacing.unit};`);
    expect(AURA_THEME_CSS).toContain(`--dg-z-index-modal: ${auraLightTokens.zIndex.modal};`);
    expect(AURA_THEME_CSS).toContain('.dark {');
    expect(AURA_THEME_CSS).toContain(`--dg-color-surface-0: ${auraDarkTokens.color?.surface0};`);
    expect(AURA_THEME_CSS).toContain(`--dg-elevation-lg: ${auraDarkTokens.elevation?.lg};`);
  });
});
