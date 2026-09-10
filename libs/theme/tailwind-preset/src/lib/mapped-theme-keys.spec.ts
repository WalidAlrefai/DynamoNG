import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

  it('exactly mirrors the `@theme` declarations in preset.css', () => {
    // `nx test` runs vitest with the workspace root as cwd.
    const css = readFileSync(
      join(process.cwd(), 'libs/theme/tailwind-preset/src/preset.css'),
      'utf-8',
    );

    // Pull the body of every top-level `@theme { … }` block (not `@utility`).
    const themeBlocks = [...css.matchAll(/@theme\s*\{([\s\S]*?)\n\}/g)].map(
      (m) => m[1] ?? '',
    );
    expect(themeBlocks.length).toBeGreaterThan(0);

    // Every `--x: …;` declaration inside those blocks is a mapped key.
    const declaredKeys = themeBlocks
      .flatMap((block) => [...block.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)])
      .map((m) => m[1] as string);

    expect(new Set(declaredKeys)).toEqual(new Set(DYNAMO_TAILWIND_THEME_KEYS));
  });
});
