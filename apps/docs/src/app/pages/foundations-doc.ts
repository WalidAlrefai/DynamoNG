import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Swatch {
  token: string;
  className: string;
  /** true when the swatch sits on a light fill and needs dark text. */
  onLight?: boolean;
}

const BRAND_ROLES: Swatch[] = [
  { token: 'primary', className: 'bg-primary text-on-primary' },
  { token: 'secondary', className: 'bg-secondary text-on-secondary' },
  { token: 'success', className: 'bg-success text-on-success' },
  { token: 'info', className: 'bg-info text-on-info' },
  { token: 'warning', className: 'bg-warning text-on-warning' },
  { token: 'danger', className: 'bg-danger text-on-danger' },
];

const SURFACE_RAMP: Swatch[] = [
  { token: 'surface-0', className: 'bg-surface-0', onLight: true },
  { token: 'surface-50', className: 'bg-surface-50', onLight: true },
  { token: 'surface-100', className: 'bg-surface-100', onLight: true },
  { token: 'surface-200', className: 'bg-surface-200', onLight: true },
  { token: 'surface-300', className: 'bg-surface-300', onLight: true },
  { token: 'surface-700', className: 'bg-surface-700 text-surface-0' },
  { token: 'surface-800', className: 'bg-surface-800 text-surface-0' },
  { token: 'surface-900', className: 'bg-surface-900 text-surface-0' },
];

const TEXT_ROLES: Swatch[] = [
  { token: 'text-primary', className: 'text-text-primary' },
  { token: 'text-muted', className: 'text-text-muted' },
  { token: 'text-disabled', className: 'text-text-disabled' },
];

// Full class names as literals so Tailwind's content scanner generates them.
const RADII = [
  { label: 'sm', className: 'rounded-sm' },
  { label: 'md', className: 'rounded-md' },
  { label: 'lg', className: 'rounded-lg' },
  { label: 'xl', className: 'rounded-xl' },
  { label: 'full', className: 'rounded-full' },
];
const ELEVATIONS = [
  { label: 'shadow-sm', className: 'shadow-sm' },
  { label: 'shadow-md', className: 'shadow-md' },
  { label: 'shadow-lg', className: 'shadow-lg' },
];
const TEXT_SIZES = [
  { label: 'text-xs', className: 'text-xs' },
  { label: 'text-sm', className: 'text-sm' },
  { label: 'text-base', className: 'text-base' },
  { label: 'text-lg', className: 'text-lg' },
];
const Z_LAYERS = [
  'z-dropdown',
  'z-overlay-panel',
  'z-drawer',
  'z-modal',
  'z-popover',
  'z-toast',
  'z-tooltip',
];

@Component({
  selector: 'docs-foundations-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="max-w-3xl space-y-12">
      <header>
        <h1 class="text-2xl font-bold text-text-primary">Foundations</h1>
        <p class="mt-1 text-text-muted">
          The design-token contract every component styles against. Values come
          from the active theme preset (Aura by default) as
          <code class="rounded bg-surface-100 px-1">--dg-*</code> custom
          properties, mapped onto Tailwind utilities by
          <code class="rounded bg-surface-100 px-1"
            >&#64;dynamong/theme/tailwind-preset</code
          >. Swapping a theme swaps the values, never a class name.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Colour roles
        </h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          @for (s of brandRoles; track s.token) {
            <div
              [class]="s.className"
              class="flex h-16 items-end rounded-md p-2 text-xs font-medium"
            >
              {{ s.token }}
            </div>
          }
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Surface ramp
        </h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          @for (s of surfaceRamp; track s.token) {
            <div
              [class]="s.className"
              class="flex h-16 items-end rounded-md border border-border p-2 text-xs font-medium"
              [class.text-text-primary]="s.onLight"
            >
              {{ s.token }}
            </div>
          }
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Text roles
        </h2>
        <div class="space-y-1">
          @for (s of textRoles; track s.token) {
            <p [class]="s.className">{{ s.token }} — The quick brown fox</p>
          }
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Radius
        </h2>
        <div class="flex flex-wrap gap-4">
          @for (r of radii; track r.label) {
            <div class="text-center">
              <div
                class="h-14 w-14 border border-border bg-surface-100"
                [class]="r.className"
              ></div>
              <span class="mt-1 block text-xs text-text-muted">{{ r.label }}</span>
            </div>
          }
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Elevation
        </h2>
        <div class="flex flex-wrap gap-6 rounded-md bg-surface-50 p-6">
          @for (e of elevations; track e.label) {
            <div class="text-center">
              <div
                class="h-14 w-14 rounded-md bg-surface-0"
                [class]="e.className"
              ></div>
              <span class="mt-1 block text-xs text-text-muted">{{ e.label }}</span>
            </div>
          }
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Type scale
        </h2>
        <div class="space-y-1">
          @for (t of textSizes; track t.label) {
            <p [class]="t.className" class="text-text-primary">
              {{ t.label }} — Design system foundations
            </p>
          }
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Focus ring
        </h2>
        <p class="text-sm text-text-muted">
          One themeable treatment, driven by
          <code class="rounded bg-surface-100 px-1">--dg-focus-*</code>. Tab to
          each control to see it. Use the inset variant on full-width rows where
          an outset ring would be clipped.
        </p>
        <div class="flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="dg-focus-ring rounded-md border border-border bg-surface-0 px-4 py-2 text-sm text-text-primary"
          >
            dg-focus-ring
          </button>
          <div class="w-56 overflow-hidden rounded-md border border-border">
            <button
              type="button"
              class="dg-focus-ring-inset block w-full px-4 py-2 text-start text-sm text-text-primary"
            >
              dg-focus-ring-inset
            </button>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Z-index layers
        </h2>
        <p class="text-sm text-text-muted">
          Named stacking order for overlays — lowest to highest. Replaces a
          single overloaded <code class="rounded bg-surface-100 px-1">z-10</code>.
        </p>
        <ol class="space-y-1">
          @for (z of zLayers; track z) {
            <li class="text-sm text-text-primary">
              <code class="rounded bg-surface-100 px-1">{{ z }}</code>
            </li>
          }
        </ol>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Density
        </h2>
        <p class="text-sm text-text-muted">
          Every <code class="rounded bg-surface-100 px-1">p-*</code> /
          <code class="rounded bg-surface-100 px-1">gap-*</code> /
          <code class="rounded bg-surface-100 px-1">h-*</code> utility derives
          from one token —
          <code class="rounded bg-surface-100 px-1">--dg-spacing-unit</code>
          (0.25rem by default). Lowering it compacts the whole system at once.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Writing mode (RTL)
        </h2>
        <p class="text-sm text-text-muted">
          Components style with writing-mode-relative utilities
          (<code class="rounded bg-surface-100 px-1">ms-*</code> /
          <code class="rounded bg-surface-100 px-1">pe-*</code> /
          <code class="rounded bg-surface-100 px-1">text-start</code> /
          <code class="rounded bg-surface-100 px-1">border-s</code>), enforced by
          an ESLint rule. Set
          <code class="rounded bg-surface-100 px-1">dir="rtl"</code> on a
          container (or <code class="rounded bg-surface-100 px-1">&lt;html&gt;</code>)
          and layout mirrors — no per-component configuration.
        </p>
      </section>
    </article>
  `,
})
export class FoundationsDocPage {
  protected readonly brandRoles = BRAND_ROLES;
  protected readonly surfaceRamp = SURFACE_RAMP;
  protected readonly textRoles = TEXT_ROLES;
  protected readonly radii = RADII;
  protected readonly elevations = ELEVATIONS;
  protected readonly textSizes = TEXT_SIZES;
  protected readonly zLayers = Z_LAYERS;
}
