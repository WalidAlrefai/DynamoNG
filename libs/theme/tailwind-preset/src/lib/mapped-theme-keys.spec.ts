import { describe, expect, it } from 'vitest';
import { DYNAMO_TAILWIND_THEME_KEYS } from './mapped-theme-keys';

describe('DYNAMO_TAILWIND_THEME_KEYS', () => {
  it('only contains well-formed CSS custom property names', () => {
    for (const key of DYNAMO_TAILWIND_THEME_KEYS) {
      expect(key).toMatch(/^--[a-z][a-z0-9-]*$/);
    }
  });

  it('has no duplicate keys', () => {
    expect(new Set(DYNAMO_TAILWIND_THEME_KEYS).size).toBe(DYNAMO_TAILWIND_THEME_KEYS.length);
  });
});
