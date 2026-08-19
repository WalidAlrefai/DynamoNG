# DynamoNG

A modern Angular UI component library styled with Tailwind CSS, built as an Nx monorepo. Architecture and
conventions are documented in full at `C:\Users\ASROCK\.claude\plans\i-want-to-create-sorted-orbit.md` (the
implementation plan this workspace was built from); this README is the practical, day-to-day reference.

## Prerequisites

- **Node.js 24.15+ or 22.22.3+** (Angular 22's own tooling enforces this at the `ng` CLI level; Nx's build
  executors are more lenient but some dependencies emit `EBADENGINE` warnings below this floor).
- **npm** (this workspace uses npm workspaces, not pnpm/yarn).

## Getting started

```sh
npm install
npm run build      # nx run-many -t build — builds every library and app
npm run test        # nx run-many -t test — runs every test suite with coverage
npm run lint         # nx run-many -t lint
npx nx serve demo    # http://localhost:4200 — the kitchen-sink consumer app
npx nx serve docs    # http://localhost:4200 — per-component docs site
```

For day-to-day work, prefer the affected variants so only what changed re-runs:

```sh
npm run build:affected
npm run test:affected
npm run lint:affected
```

## Workspace structure

```
DynamoNG/
├── libs/
│   ├── core/               # @dynamong/core — config, base, api, a11y (secondary entry points)
│   ├── utils/               # @dynamong/utils — dom, class-merge (secondary entry points)
│   ├── icons/                # @dynamong/icons — shared icon components (currently: check)
│   ├── theme/                # @dynamong/theme — tokens, tailwind-preset (secondary entry points)
│   │   └── presets/aura/       # @dynamong/theme-aura — a concrete theme preset
│   ├── testing/              # @dynamong/testing — shared test utilities
│   └── components/
│       ├── forms/               # button, checkbox, radio, input-text, select
│       └── overlay/             # dialog
├── apps/
│   ├── demo/                 # kitchen-sink app consuming @dynamong/* as installed packages, incl. a Playwright e2e/visual-regression target
│   └── docs/                  # per-component documentation site
└── tools/
    ├── workspace-plugin/     # local Nx plugin hosting the custom `component` generator
    └── typedoc/               # generates apps/docs' API tables from source for migrated components
```

Each `@dynamong/*` package installs independently (`npm i @dynamong/button`); components never depend on
other domains' components, only on `core`/`utils`/`theme` — enforced by `@nx/enforce-module-boundaries` in
the root `eslint.config.mjs`.

## Components

| Component  | Package                | Validates                                                                                                  |
| ---------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Button     | `@dynamong/button`     | Base class + `cva` variant pattern                                                                         |
| Checkbox   | `@dynamong/checkbox`   | `model()` two-way binding; consumes `@dynamong/icons`                                                      |
| Radio      | `@dynamong/radio`      | Native radio-group semantics via a split `[checked]`/`(checkedChange)` binding — no `RadioGroup` container |
| Input Text | `@dynamong/input-text` | `ControlValueAccessor` / reactive forms                                                                    |
| Select     | `@dynamong/select`     | Composite combobox pattern, full keyboard nav, CVA                                                         |
| Dialog     | `@dynamong/dialog`     | CDK focus trapping, modal semantics                                                                        |

Every component ships: a standalone `OnPush` component, a `*.styles.ts` file (the _only_ place Tailwind
utility classes live, via `class-variance-authority`), a `*.types.ts` file, a CDK `ComponentHarness` for
consumer testing, and a `*.spec.ts` covering creation, default behavior, inputs, outputs, user interactions,
conditional rendering, template behavior, accessibility, state changes, and edge cases.

## Styling & theming

Tailwind utility classes never reference hardcoded values — they resolve through `--dg-*` CSS custom
properties:

```
design tokens (libs/theme/tokens)
  → compiled to --dg-* custom properties per theme (libs/theme/presets/aura)
  → mapped onto Tailwind's @theme scale (libs/theme/tailwind-preset/src/preset.css)
  → consumed via ordinary Tailwind classes in *.styles.ts (bg-primary, text-on-primary, ...)
```

Swapping a theme means swapping the `--dg-*` values at `:root`, never touching a component template. Set
`unstyled` on any component to opt out of built-in classes entirely (the `styleClass`/`pt` inputs on
`DynamoBaseComponent` remain available as the customization escape hatch).

**Consumer installation** (published-package scenario): install Tailwind, `@import` `tailwindcss` and
`@dynamong/theme/tailwind-preset/preset.css` in your global stylesheet, import a compiled theme stylesheet,
and call `provideDynamoNG({ theme: 'aura' })` in `app.config.ts`. See `apps/demo/src/styles.css` for a
working example — note that within _this_ monorepo it uses a relative import instead of the bare package
specifier (see the comment there for why).

## Testing

- **Runner**: Vitest via Angular's native `@angular/build:unit-test` builder (Karma is deprecated upstream).
- **Zoneless**: every spec runs under `provideZonelessChangeDetection()`.
- **`@dynamong/testing`** provides `renderDynamoComponent()` (TestBed + zoneless + DynamoNG config, attaches
  to `document.body` for CDK interactivity checks), `expectNoA11yViolations()` (axe-core), keyboard helpers,
  and mock factories.
- **Coverage**: enforced via `nx.json` `targetDefaults` (applies to every project automatically) —
  80% statements/lines/functions, 75% branches for components; 90/90/90/85 for `core`/`utils`/`testing`
  (overridden per-project). Coverage is scoped to each project's own `src/**` via `coverageInclude`/
  `coverageExclude` so a component's coverage isn't diluted by its dependencies' code. `apps/demo` and
  `apps/docs` skip coverage entirely (`coverage: false`) — they're integration smoke tests, not the primary
  testable unit.

Run a single project: `npx nx test forms-button`. Run everything: `npm run test`.

## The custom component generator

`tools/workspace-plugin/src/generators/component` scaffolds a new component (Angular library + our file
template: `.ts`/`.html`/`.types.ts`/`.styles.ts`/`.harness.ts`/`.spec.ts` with all ten checklist sections
pre-populated) so every future component starts from the same shape. Its logic is validated by its own unit
tests (`nx test workspace-plugin`).

`npx nx g @dynamong/workspace-plugin:component <name> --domain=<domain>` now works directly — the earlier
"implementation is not a function" failure was two real, environment-independent bugs, not a Node version
issue: the plugin package was missing from root `package.json`'s `workspaces` array (so it wasn't resolvable
at all once installed), and `component.ts` only had a named export where Nx's CLI generator runner needs a
callable default export. Both are fixed. Note the generator only produces the generic per-component
boilerplate shape (a plain single-size-variant component) — it does not know about a component's actual
design (e.g. Radio's group-aware API), which still needs hand-authoring on top, same as before.

## Known simplifications (honest follow-up list)

This workspace was built across a few focused sessions. Deliberate scope cuts, so nothing here is a silent
gap:

- **Only 6 components** are implemented (Button, Checkbox, Radio, Input Text, Select, Dialog) out of the
  ~130 a mature library would eventually have. The generator + conventions are proven; scaling to a much
  larger component surface is now a repetitive, well-defined task, not an architectural unknown.
- **`@dynamong/icons` has exactly one icon** (the checkmark, migrated out of `DynamoCheckbox`'s previously
  inline `<svg>`) — proves the library's shared-icon pattern (`DynamoIconBase` + per-icon component) is
  integrated, but PrimeNG's ~55-icon set has not been ported.
- **Visual regression testing is scaffolded, not yet a working gate**: `apps/demo` has a Playwright `e2e`
  target with one screenshot per component, but no baseline images are committed yet — they need to come
  from an actual `ubuntu-latest` CI run (`--update-snapshots`), not this/any Windows dev machine, since
  cross-platform font rendering would produce false-positive diffs.
- **TypeDoc-based API extraction covers 2 of 6 components** (Checkbox, Radio) — `tools/typedoc` generates
  their docs-page API tables from real source (`apps/docs/src/app/generated/api/*.json`, regenerated by the
  `docs-api` Nx target on every build/test/serve of `docs`). Button/Input Text/Select/Dialog's tables are
  still hand-written; migrating them is now a fast, mechanical repeat of the same pattern.
- **`eslint-plugin-tailwindcss`'s class-order/no-conflicting-class rules are installed but disabled** (see
  `eslint.config.mjs`) — the plugin's Tailwind v4 config resolution didn't cooperate with this monorepo's
  per-library source layout in the time available. The convention itself (Tailwind classes only in
  `*.styles.ts`) is still enforced by the generator template and code review.
- **Nx Cloud is intentionally not connected** (user's explicit choice) — local caching only.
- **`DynamoDatePicker` is single-date, month-grid only, v1**: no date ranges, no multi-select, no
  time picker, no dedicated year-picker mega-view (only prev/next-month header navigation and
  Shift+PageUp/PageDown for ±1 year on a focused grid cell). Disabling is `min`/`max` range-only —
  there's no arbitrary `disabledDate` predicate input. There's no manual free-text date entry either:
  the trigger is a non-editable button (like `DynamoSelect`'s combobox trigger), not an editable text
  field, so there's no date-string parsing/validation surface to get wrong. Display formatting
  (trigger text, month/year heading, weekday abbreviations) is fixed to
  `Intl.DateTimeFormat(config.locale, ...)` with hardcoded per-purpose options — there's no
  `dateFormat` input for a custom pattern. `weekStartsOn` defaults to `0` (Sunday, matching
  `date-fns`'s own default) and is **not** derived from `config.locale` — a locale→weekStartsOn table
  would be new, un-scoped i18n infrastructure; consumers who need a Monday-start week pass
  `weekStartsOn="1"` themselves. The "Previous month"/"Next month" button `aria-label`s are fixed
  English strings, not locale-translated — `config.locale` is used only for `Intl.DateTimeFormat`
  date/number-shaped formatting, not UI microcopy; no canned per-locale strings table exists anywhere
  in this codebase yet, and building one is a larger, cross-component concern out of scope here.
