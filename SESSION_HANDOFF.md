# Session handoff — DynamoNG component library work

Delete this file once you've read it into your new session — it's a one-time
handoff note, not part of the product.

## What this project is

`DynamoNG` — a white-label Angular component library (`@dynamong/*`), Nx 23 +
Angular 22 (standalone, signals-only: `input()`/`model()`/`output()`/
`effect()`/`computed()`/`viewChild()`/`contentChildren()`) + Tailwind v4
CSS-first. A separate `E:\D\Projects\UI\primeng` clone exists in the same
parent folder purely as an API/behavior reference — never edited, never
copied from directly.

Branch: `Walid/add-new-components`, currently **pushed and up to date with
origin** — `git pull` on this branch gets you everything below.

## Components built this session (chronological)

Radio, Switch, Textarea, then (after a mid-session compaction) **Tooltip,
Tabs, Accordion, Menu, Toast, Badge** — six components in six separate
commits (`65e273b` combines Tooltip+Tabs since their shared-file edits
interleaved; `34131bd`, `314a400`, `392f0aa`, `a66d723` are one each for
Accordion/Menu/Toast/Badge).

Current full component roster: Button, Checkbox, Radio, Switch, Input Text,
Textarea, Select, Dialog, Tooltip, Tabs, Accordion, Menu, Toast, Badge.

Domains: `forms`, `overlay` (Dialog, Tooltip, Menu), `panel` (Tabs,
Accordion), `feedback` (Toast, Badge — introduced this session, required
widening `tools/workspace-plugin/src/generators/component/schema.json`'s
domain enum and `component-registry.ts`'s domain union).

## Key architectural patterns established this session

- **`contentChildren()` compound-component pattern** (Tabs → Accordion →
  Menu): a coordinator component reads lightweight, non-`DynamoBaseComponent`
  child "data holder" components via `contentChildren()`, renders all DOM
  itself. Each coordinator hand-rolls the same `findEnabledIndex(from, delta)`
  roving-tabindex helper (wrap, skip-disabled) — copied/adapted three times
  now, deliberately not abstracted into a shared utility yet.
- **`DynamoOverlayService`** (`libs/core/overlay`) — CDK Overlay wrapper.
  `createConnectedOverlay` (trigger-anchored, used by Tooltip/Menu) plus a new
  `createGlobalOverlay` (viewport-anchored, added this session for Toast).
- **Toast is the library's first service-driven component** — `DynamoToastService`
  (`providedIn: 'root'`), no template tag at all, mounts a `ComponentPortal`
  container per position on first use. No harness (the CDK-harness pattern
  assumes a consumer-placed host tag, which doesn't exist here).
- **Shared vocabulary reuse**: `DynamoSeverity`/`DynamoSize` from
  `@dynamong/core/api` reused as-is by Toast and Badge — no new type per
  component when an existing one fits.
- **Real DOM focus, not `aria-activedescendant`**, for every keyboard-navigable
  list (Tabs/Accordion/Menu items) — established from Tabs onward, kept
  consistent throughout.

## Standing conventions (confirmed repeatedly this session)

- Only commit when explicitly asked — never proactively.
- Pushing requires a **separate**, explicit instruction from committing.
- Never run `git config`.
- Every new/edited file must go through `npx nx format:write --base=origin/master`
  before committing — forgetting this has caused CI failures multiple times.
- After building a component: run its own `test`/`lint`/`build`, then a full
  `npx nx run-many -t lint test build build-css --parallel=3` sweep, then a
  live Chrome browser check before calling it done.
- New components follow the plan-mode workflow: brainstorm/recommend →
  `AskUserQuestion` or explicit user pick → write a plan (context, design
  decisions, files, verification) → `ExitPlanMode` → implement.

## Outstanding work

- **Playwright visual baselines are missing for all six new components**
  (Tooltip, Tabs, Accordion, Menu, Toast, Badge). Each has a
  `components-visual.spec.ts` test already written but no committed baseline
  PNG yet. Generate via the Linux Docker container workflow used earlier in
  the session:
  ```
  docker run --rm -v "$(pwd -W):/work" -v playwright_node_modules:/work/node_modules \
    -w /work mcr.microsoft.com/playwright:v1.61.1-jammy bash -c \
    "npm ci && npx nx build demo && npx nx e2e demo --update-snapshots"
  ```
  (Use `MSYS_NO_PATHCONV=1` in front if running from Git Bash.)
- No component chosen yet for what's next after Badge — last "what's next"
  answer was pending when this session ended.
