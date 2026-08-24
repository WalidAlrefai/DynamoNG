import nx from '@nx/eslint-plugin';
import tailwindcss from 'eslint-plugin-tailwindcss';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Foundational layers: core/util/theme must stay dependency-free of
            // everything above them so the graph stays shallow and `nx affected`
            // stays fast as the component count grows.
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
            {
              sourceTag: 'type:theme',
              onlyDependOnLibsWithTags: ['type:util', 'type:theme'],
            },
            {
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: ['type:core', 'type:util'],
            },
            {
              sourceTag: 'type:testing',
              onlyDependOnLibsWithTags: ['type:core', 'type:util'],
            },
            // Components may use every foundational layer, plus other components
            // in the SAME domain (see the domain:* constraints below) and the
            // shared testing helpers (intended for .spec.ts files only).
            {
              sourceTag: 'type:component',
              onlyDependOnLibsWithTags: [
                'type:core',
                'type:util',
                'type:theme',
                'type:component',
                'type:testing',
              ],
            },
            // Component-to-component dependencies are ordered by tier, not
            // fenced off by UI category: `tier:N` may depend on foundation
            // (type:core/util/theme/testing) plus any `tier:M` where M < N,
            // never same-or-higher tier. That strict ordering makes cycles
            // structurally impossible, while still letting any component
            // reuse any other component — it just has to accept becoming a
            // higher tier than whatever it now depends on (e.g. a component
            // that starts depending on a `tier:0` component must itself move
            // to at least `tier:1`; the lint rule fails immediately if that
            // bump is forgotten). `domain:*` tags remain on projects purely
            // as organizational/folder metadata — nothing here reads them.
            //
            // Defined two tiers deeper than today's actual max depth (2, see
            // `forms-date-picker`/`forms-multi-select`/`forms-pagination` →
            // `forms-select` → `forms-input-text`). To go deeper later, copy
            // the highest block, bump N, and list every `tier:0..N-1` in its
            // `onlyDependOnLibsWithTags`.
            {
              sourceTag: 'tier:0',
              onlyDependOnLibsWithTags: [
                'type:core',
                'type:util',
                'type:theme',
                'type:testing',
              ],
            },
            {
              sourceTag: 'tier:1',
              onlyDependOnLibsWithTags: [
                'type:core',
                'type:util',
                'type:theme',
                'type:testing',
                'tier:0',
              ],
            },
            {
              sourceTag: 'tier:2',
              onlyDependOnLibsWithTags: [
                'type:core',
                'type:util',
                'type:theme',
                'type:testing',
                'tier:0',
                'tier:1',
              ],
            },
            {
              sourceTag: 'tier:3',
              onlyDependOnLibsWithTags: [
                'type:core',
                'type:util',
                'type:theme',
                'type:testing',
                'tier:0',
                'tier:1',
                'tier:2',
              ],
            },
            {
              sourceTag: 'tier:4',
              onlyDependOnLibsWithTags: [
                'type:core',
                'type:util',
                'type:theme',
                'type:testing',
                'tier:0',
                'tier:1',
                'tier:2',
                'tier:3',
              ],
            },
            // Apps may depend on anything publishable; nothing may depend on an app.
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:core',
                'type:util',
                'type:theme',
                'type:component',
                'type:testing',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  {
    // Tailwind utility classes are only ever allowed to live in `*.styles.ts`
    // (cva() variant definitions) — never inline in a template; that convention
    // is enforced by the component generator template and code review.
    //
    // eslint-plugin-tailwindcss's class-order/no-conflicting-class rules are
    // installed but NOT enabled here: v4's config loader insists on resolving
    // a per-directory CSS entry point (it probes for `<dir>/style.css` next to
    // each linted file) and doesn't yet have a documented way to point it at
    // one shared preset across a monorepo with per-library source directories.
    // Follow-up: revisit once the plugin's Tailwind v4 config-resolution story
    // matures, or author a small custom rule against our own `cva()` convention.
    files: ['**/*.styles.ts'],
    plugins: { tailwindcss },
    rules: {},
  },
  {
    files: ['**/*.json'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
