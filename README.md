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

| Component    | Package                  | Validates                                                                                                  |
| ------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Button       | `@dynamong/button`       | Base class + `cva` variant pattern                                                                         |
| Checkbox     | `@dynamong/checkbox`     | `model()` two-way binding; consumes `@dynamong/icons`                                                      |
| Radio        | `@dynamong/radio`        | Native radio-group semantics via a split `[checked]`/`(checkedChange)` binding — no `RadioGroup` container |
| Input Text   | `@dynamong/input-text`   | `ControlValueAccessor` / reactive forms                                                                    |
| Select       | `@dynamong/select`       | Composite combobox pattern, CDK Overlay, filtering, full keyboard nav, CVA                                 |
| Multi Select | `@dynamong/multi-select` | Tag-based multi-select, shares `DynamoListboxBase` with Select, select all/clear all, grouping             |
| Dialog       | `@dynamong/dialog`       | CDK focus trapping, modal semantics                                                                        |

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
- **`DynamoTable` is client-side, single-column-sort only, v1**: no virtual scrolling or column
  resize/reorder/pinning — v1 cells render a plain computed value via each column's optional `cell`
  accessor function, not an arbitrary Angular template (per-cell template projection and global
  filtering are added in v3, see below). Sorting cycles a single active column through ascending →
  descending → unsorted on repeated header
  clicks (no multi-column/shift-click sort, no memory of a previously-sorted column once a different
  one is clicked). The default comparator reads each column's raw `field` value directly off the
  row — **never** through `cell`'s display-formatting function, so a column can format dates/labels
  for display while still sorting correctly by the underlying value — treats `null`/`undefined` as
  always sorting last regardless of direction, and compares Dates/numbers/booleans natively before
  falling back to a locale-aware, numeric-sensitive `String.localeCompare` for everything else; pass
  a column's own `sortFn` to override entirely. There's no `sortChange` output: the sorted result is
  purely internal presentation state with no server round-trip to coordinate. No `@angular/cdk/table`
  (`CdkTable`) dependency
  either — v1's plain `columns`/`data` array API and lack of virtual scrolling/sticky columns/
  declarative cell-template projection don't need it; the markup is a hand-rolled semantic
  `<table>`/`<thead>`/`<tbody>`, the same pattern as `DynamoSelect`'s plain options array and
  `DynamoDatePicker`'s calendar grid. Uses plain `<table>` ARIA semantics (`aria-sort` on the active
  sortable `<th>` only) per the WAI-ARIA APG "Table" pattern, not `role="grid"` — there's no per-cell
  keyboard grid navigation to justify it.
- **`DynamoTable` v2 adds opt-in client-side pagination and row selection** — both off by default, so
  existing `<dg-table [columns]="..." [data]="...">` usage with no new inputs renders every row
  unpaginated, exactly as in v1. **Pagination**: set `pageSize` to enable a Prev/Next + "Page X of Y"
  footer; `page` (1-indexed) is two-way bindable via `[(page)]`. There's no numbered page-button
  strip, matching `DynamoDatePicker`'s Prev/Next-only month nav — no jump-to-page input either.
  `page()` is read through a clamp (`[1, pageCount()]`) rather than ever being corrected by the
  component itself: if an externally-bound `page` is out of range (e.g. `data()` shrinks while a
  consumer's own signal still points past the end), the table renders the clamped page but leaves
  the bound value unchanged until the next Prev/Next click, which writes the corrected value back —
  a deliberate simplification to keep the component free of `effect()`s. Clicking a sortable column
  header resets to page 1 (Table owns that interaction); **changing `pageSize` itself does not**
  reset to page 1, it only re-clamps — if you need a hard reset when the page size changes, set
  `page` to `1` yourself in the same handler that changes `pageSize` (you already own that value).
  **Selection**: set `selectable` to render a checkbox column; `selected` (a two-way bindable array
  of the actual selected row objects) is the entire event surface — no separate `selectionChange`
  output, mirroring `DynamoAlert`/`DynamoDialog`'s own `model()`-only pattern. Selection membership
  reuses the `trackBy` input as its identity key (falling back to `===` reference equality when
  unset) rather than adding a second identity input — this only produces stable cross-page/cross-sort
  selection when a provided `trackBy` is a pure function of the row's own data (e.g.
  `(row) => row.id`), the same pattern already recommended over index-based tracking for sorting. The
  header "select all" checkbox is tri-state (checked/unchecked/indeterminate, set via Angular's
  native DOM-property binding, same technique `DynamoCheckbox` already uses) and is scoped to the
  **current page only** when paginated (or all rows, unpaginated) — selecting every row across every
  page is a materially different feature (it typically needs its own "N selected across M pages"
  banner) and remains out of scope. Selection checkboxes are plain native `<input type="checkbox">`
  elements styled with Tailwind's `accent-*` utility, not `DynamoCheckbox` — Table (`domain:data`)
  can't depend on Checkbox (`domain:forms`) across the module-boundary rule, and native checkboxes
  get keyboard/screen-reader operability for free.
- **`DynamoTable` v3 adds opt-in global filtering and opt-in per-cell template projection** — both
  fully additive; existing `<dg-table>` usage with no new inputs is unaffected. **Filtering**: set
  `filterable` to render a search `<input type="search">` above the table (a native input styled to
  match `DynamoInputText`'s size scale — Table can't depend on Input Text across the module boundary,
  same reasoning as the hand-rolled selection checkboxes); `filterPlaceholder` customizes its
  placeholder text, and `filterText` is two-way bindable (`[(filterText)]`) so a consumer can read,
  clear, or pre-fill the query externally. A row matches when ANY column whose `filterable` is not
  explicitly `false` has a `String(cellValue(row, column))` (case-insensitively) containing the
  trimmed, lowercased query — blank/whitespace-only `filterText` matches every row. Filtering runs as
  a new pipeline stage before sorting (`data() → filteredData() → sortedData() → pagedData()`), so
  sorting, selection, and pagination all transparently operate on the filtered set with zero extra
  wiring — "select all" after filtering, for instance, naturally scopes to only the
  filtered-and-current-page rows. Typing in the search box resets to page 1, the same way clicking a
  sortable header already does. Filtering deliberately does NOT bypass `cell()` the way the default
  sort comparator does: filtering reads `cellValue(row, column)` (`cell()`'s formatted output when
  present, else the raw `field` value) — matching what's conceptually shown on screen — while the
  default sort comparator always reads the raw `field` value regardless of `cell`. Neither sort nor
  filter ever reads `cellTemplate` — only rendering does. Three distinct "no rows" states are
  disambiguated in the empty-state row: genuinely empty `data()` always shows `emptyMessage` (even
  with an active-but-irrelevant filter bound); `data()` with rows but zero filter matches shows the
  new `noMatchesMessage`; pagination's existing clamp-prevents-empty-page guarantee continues to hold
  transparently. There's no per-column filter UI and no matched-text highlighting — both out of
  scope. **Per-cell template projection**: any column may set `cellTemplate` to a
  `TemplateRef<DynamoTableCellContext<TRow>>`; Table renders it via `NgTemplateOutlet` (already used
  elsewhere in this codebase by `DynamoTabs`) instead of the plain `cellValue(row, column)`
  interpolation, with context `{ $implicit: row, row, index }`. `index` is the row's absolute
  position in `sortedData()` (before pagination slices it) — matching `trackBy`'s own index
  convention, NOT `@for`'s page-relative `$index` — so a `cellTemplate` reading `index` sees a stable
  value whether or not `pageSize` is set. `cellTemplate` is rendering-only: sorting and filtering are
  completely unaware of it and always read `cellValue` — a column may set `cell` (for sort/filter) and
  `cellTemplate` (for display) independently, e.g. a status column that sorts/filters by its text
  while rendering a `<dg-badge>`. A consumer obtains the `TemplateRef` the standard Angular way
  (`viewChild(TemplateRef)` reading their own `<ng-template #x let-row let-i="index">`) and assigns it
  into their `columns` array themselves — there's no new content-projection machinery beyond adding
  `NgTemplateOutlet` to Table's own `imports`.
- **`DynamoSelect` v2 redesigns the panel around `DynamoOverlayService`/CDK Overlay** (matching
  `DynamoMenu`/`DynamoDatePicker`/`DynamoTooltip`) instead of v1's plain CSS `absolute` positioning —
  fixes clipping inside `overflow` ancestors, adds viewport-edge flipping via `position`'s 4-corner
  fallback order, and adds real outside-click/backdrop-to-close (v1 had none at all). Adds opt-in
  `filterable`/`filterText`/`filterPlaceholder`/`noResultsMessage` (mirroring `DynamoTable`'s exact
  precedent, including the same empty-vs-no-matches message split), `invalid` (a new
  `selectTriggerStyles` variant, matching `DynamoInputText`'s), `clearable` (an "x" button that clears
  without opening), and single-level `group?: string` on `DynamoSelectOption` (grouped options render
  `role="presentation"` headings, skipped by keyboard nav; ungrouped options are unaffected — fully
  backward compatible, zero breaking changes for existing consumers). The filter box is a **real**
  `<dg-input-text>` (both are `domain:forms`, so — unlike Table's forced native-`<input>` workaround —
  a genuine cross-component import is legal), wired via `[ngModel]`/`(ngModelChange)` since
  `DynamoInputText` has no direct value output, only full `ControlValueAccessor`. The filter box (and,
  for `DynamoMultiSelect`, the select-all/clear-all row) must live in the panel wrapper _outside_ the
  `<ul role="listbox">`, not inside it as an `<li>` — ARIA's `listbox` role only permits `option`/
  `group` as owned children, so nesting a real `<input>`/`<button>` inside it is an
  `aria-required-children` axe violation; this was caught live by `DynamoMultiSelect`'s own a11y spec
  and fixed in both components (`selectPanelWrapperStyles` now carries the border/shadow/scroll chrome
  for the whole panel, `selectListboxStyles` is just the bare `<ul>`'s padding). The CDK-Overlay
  lifecycle, filter/group pure functions, and roving-focus keyboard nav are factored into a shared
  `DynamoListboxBase` abstract class + `select-option-filter.ts`/`listbox-positioning.ts`, all exported
  from `@dynamong/select`'s public entry — a deliberate exception to "duplicate small stuff across
  domain boundaries" (seen elsewhere for the h-8/h-10/h-12 size scale), justified because the overlay
  attach/detach/backdrop/dispose sequence is subtle, effect-timing-sensitive code where a second
  hand-copy risks silent drift, not cosmetic duplication. Filtering is still client-side substring-only
  (no fuzzy match, no remote/async option loading); grouping is one level only (no nested subgroups);
  `position`'s viewport-edge handling is CDK's generic 4-corner collision fallback, not a bespoke
  "prefer more space" heuristic.
- **`DynamoMultiSelect` v1 is new**, built on the same `DynamoListboxBase`/filter/group/keyboard-nav
  machinery as `DynamoSelect` (a real same-domain import — both are `domain:forms` — not a
  duplication). `value` is a two-way `TValue[]` model; toggling an option (click, Space, or Enter)
  does **not** close the panel, unlike `DynamoSelect`'s select-and-close. Selected values render as
  removable tag pills in the trigger — locally-styled markup mirroring `DynamoChip`'s pill shape
  (`domain:feedback`, not importable across the `domain:forms` boundary), simplified to one neutral
  look since tags don't need Chip's severity/variant matrix. The per-option check indicator is
  **deliberately not** a real `<dg-checkbox>`: that component's native `<input>` is independently
  Tab-focusable, which would add a phantom tab stop inside every `role="option"` `<li>` and break the
  listbox's single-tab-stop/virtual-focus model — instead it's a decorative-only box mirroring
  `checkboxBoxStyles`'s visual, rendered with the real (non-focusable) `DynamoCheckIcon`. Ships all
  four scoped features: **select all/clear all** (buttons in the panel, scoped to the current
  filtered/visible option set — "select all across a filter" and "select all across every filter" are
  different features, only the former is implemented); **`maxSelected`** (an optional cap — remaining
  unselected options become synthetically `disabled` once reached, never mutating the real `options()`
  array — with a `maxSelectedMessage` shown, but no toast/other affordance beyond that); **overflow tag
  display** (`maxVisibleTags` collapses the trigger's tag list to the first N plus a "+N more" summary,
  via a configurable `overflowLabelFn`); and **grouping** (same one-level `group?` field as Select).
  The trigger itself carries `role="combobox"` on a plain focusable `<div tabindex="0">`, not a
  `<button>` like Select's — a `<button>` can't legally contain the per-tag remove `<button>`s (nested
  interactive content), and `DynamoSelect`'s own fix for its single clear button (a sibling button, not
  nested) doesn't scale to an arbitrary number of tag-remove buttons interleaved with text.
