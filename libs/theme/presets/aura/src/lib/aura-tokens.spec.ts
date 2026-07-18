import { describe, expect, it } from 'vitest';
import { auraDarkTokens, auraLightTokens } from './aura-tokens';
import { AURA_THEME_CSS } from './aura-theme-css';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('auraLightTokens', () => {
  it('defines a valid hex value for every color token', () => {
    for (const [name, value] of Object.entries(auraLightTokens.color)) {
      expect(value, `color.${name}`).toMatch(HEX_COLOR);
    }
  });

  it('defines every radius token as a CSS length or keyword', () => {
    for (const value of Object.values(auraLightTokens.radius)) {
      expect(value).toMatch(/^[\d.]+(rem|px)$|^9999px$/);
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
    expect(AURA_THEME_CSS).toContain('.dark {');
    expect(AURA_THEME_CSS).toContain(`--dg-color-surface-0: ${auraDarkTokens.color?.surface0};`);
  });
});
