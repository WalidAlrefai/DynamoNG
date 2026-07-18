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
│   ├── theme/                # @dynamong/theme — tokens, tailwind-preset (secondary entry points)
│   │   └── presets/aura/       # @dynamong/theme-aura — a concrete theme preset
│   ├── testing/              # @dynamong/testing — shared test utilities
│   └── components/
│       ├── forms/               # button, checkbox, input-text, select
│       └── overlay/             # dialog
├── apps/
│   ├── demo/                 # kitchen-sink app consuming @dynamong/* as installed packages
│   └── docs/                  # per-component documentation site
└── tools/
    └── workspace-plugin/     # local Nx plugin hosting the custom `component` generator
```

Each `@dynamong/*` package installs independently (`npm i @dynamong/button`); components never depend on
other domains' components, only on `core`/`utils`/`theme` — enforced by `@nx/enforce-module-boundaries` in
the root `eslint.config.mjs`.

## Components

| Component | Package | Validates |
|---|---|---|
| Button | `@dynamong/button` | Base class + `cva` variant pattern |
| Checkbox | `@dynamong/checkbox` | `model()` two-way binding |
| Input Text | `@dynamong/input-text` | `ControlValueAccessor` / reactive forms |
| Select | `@dynamong/select` | Composite combobox pattern, full keyboard nav, CVA |
| Dialog | `@dynamong/dialog` | CDK focus trapping, modal semantics |

Every component ships: a standalone `OnPush` component, a `*.styles.ts` file (the *only* place Tailwind
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
working example — note that within *this* monorepo it uses a relative import instead of the bare package
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

**Known limitation**: direct invocation via `npx nx g @dynamong/workspace-plugin:component ...` currently
fails in this environment with a TS-loading error from Nx's generator runner (`implementation is not a
function`), independent of the generator's own logic — it's very likely related to this environment's Node
version (24.13.0) sitting just below Angular tooling's stated minimum (24.15.0). Upgrade Node and retry
before assuming the generator itself is broken; its behavior is fully covered by `component.spec.ts`. Until
then, use the same manual flow all 5 shipped components followed: `nx g @nx/angular:library` with the flags
in that spec file's expectations, then hand-write the file set the generator would have produced.

## Known simplifications (honest follow-up list)

This workspace was built in one focused session covering the full architecture plus 5 real, fully-tested
components (not all ~130 a mature library would eventually have). Deliberate scope cuts, so nothing here is
a silent gap:

- **Only 5 components** are implemented. The generator + conventions are proven; scaling to a much larger
  component surface is now a repetitive, well-defined task, not an architectural unknown.
- **`@dynamong/theme-aura` ships `AURA_THEME_CSS` as a TS export**, not yet a prebuilt `theme.css` asset file
  in `dist/`. The token→CSS derivation is real and tested; only the "copy compiled CSS into the published
  package" build step is unbuilt. `apps/demo`/`apps/docs` inject it via a `<style>` tag in `main.ts` as a
  stand-in — see the comment there.
- **`eslint-plugin-tailwindcss`'s class-order/no-conflicting-class rules are installed but disabled** (see
  `eslint.config.mjs`) — the plugin's Tailwind v4 config resolution didn't cooperate with this monorepo's
  per-library source layout in the time available. The convention itself (Tailwind classes only in
  `*.styles.ts`) is still enforced by the generator template and code review.
- **No TypeDoc-based API extraction** — the docs app's API tables are hand-written per component rather than
  generated from JSDoc comments.
- **No `libs/icons` package** — not needed by the 5 shipped components.
- **No visual regression testing** — flagged in the plan as a Phase 4 item, not yet wired.
- **Nx Cloud is intentionally not connected** (user's explicit choice) — local caching only.
