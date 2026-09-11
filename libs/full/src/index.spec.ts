import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as full from './index';

/** Reads a workspace-root-relative JSON file. `nx test` runs vitest with the
 * workspace root as cwd. `tsconfig.base.json` and `libs/full/package.json` are
 * both plain, comment-free JSON. */
function readJson(workspaceRelativePath: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(process.cwd(), workspaceRelativePath), 'utf-8'),
  );
}

describe('@dynamong/full', () => {
  it('has no exports of its own — it exists only to be depended on', () => {
    // `export {}` compiles to a module with no named bindings; Vite's ESM
    // interop adds a synthetic `default` key when star-importing it, so
    // filter that out rather than asserting on it.
    expect(Object.keys(full).filter((key) => key !== 'default')).toEqual([]);
  });

  it('declares a dependency on every @dynamong/* component package — no drift', () => {
    // The whole point of this package is that `npm i @dynamong/full` pulls in
    // the entire library. Nothing is imported from `index.ts`, so
    // `@nx/dependency-checks` cannot notice a component that was added without
    // being wired in here — this test is that check. The source of truth is
    // `tsconfig.base.json`'s path mappings: a single-segment `@dynamong/<name>`
    // key whose target is under `./libs/components/` is exactly a publishable
    // component package (secondary entry points like `@dynamong/core/base` have
    // two segments; `icons`/`testing`/`theme-aura`/`full` map outside
    // `libs/components/`).
    const tsconfig = readJson('tsconfig.base.json') as {
      compilerOptions: { paths: Record<string, string[]> };
    };
    const pkg = readJson('libs/full/package.json') as {
      dependencies: Record<string, string>;
    };

    // `full` also lists these three umbrellas; they aren't component packages,
    // so exclude them from the comparison rather than special-casing the paths.
    const foundationUmbrellas = [
      '@dynamong/core',
      '@dynamong/utils',
      '@dynamong/theme',
    ];

    const expected = Object.entries(tsconfig.compilerOptions.paths)
      .filter(
        ([name, targets]) =>
          /^@dynamong\/[^/]+$/.test(name) &&
          (targets[0] ?? '').startsWith('./libs/components/'),
      )
      .map(([name]) => name)
      .sort();

    const actual = Object.keys(pkg.dependencies)
      .filter(
        (name) =>
          name.startsWith('@dynamong/') && !foundationUmbrellas.includes(name),
      )
      .sort();

    expect(actual).toEqual(expected);
  });
});
