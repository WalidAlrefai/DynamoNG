# theme-aura

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx run-many -t build build-css -p theme-aura` (or just `npm run build` at the repo root,
which requests both targets workspace-wide) to build the library and its CSS asset together.
`build-css` (`scripts/build-theme-css.ts`) runs after `build` — not before — because the `build`
target's own output-directory cleanup would otherwise delete `theme.css` if it ran second. Running
plain `nx build theme-aura` alone only produces the compiled `.js`/`.d.ts`, not `theme.css`.

`build-css` writes a prebuilt `dist/libs/theme/presets/aura/theme.css` containing the same
`--dg-*` custom properties as the `AURA_THEME_CSS` TS export, so external consumers can do:

```css
@import "tailwindcss";
@import "@dynamong/theme/tailwind-preset/preset.css";
@import "@dynamong/theme-aura/theme.css";
```

instead of importing `AURA_THEME_CSS` and injecting a `<style>` tag manually. (This repo's own
`apps/demo`/`apps/docs` still use the `<style>`-tag approach for local dev, since npm workspaces
symlinks this package to source rather than `dist` — the prebuilt asset only exists once built.)

## Running unit tests

Run `nx test theme-aura` to execute the unit tests via [Vitest](https://vitest.dev/).
