import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { COMPONENT_REGISTRY } from '../component-registry';

@Component({
  selector: 'docs-components-index-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="space-y-12">
      <header>
        <h1 class="text-2xl font-bold text-text-primary">Components</h1>
        <p class="mt-1 text-text-muted">A modern Angular UI component library styled with Tailwind CSS.</p>
      </header>

      <article class="space-y-8">
        <header>
          <h2 class="text-xl font-bold text-text-primary">Installation &amp; Usage</h2>
          <p class="mt-1 text-text-muted">
            Every <code class="font-mono text-sm">&#64;dynamong/*</code> package installs independently, so you
            only ever pull in what you actually use.
          </p>
        </header>

        <section>
          <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">1. Install</h3>
          <p class="mb-2 text-sm text-text-muted">
            Install the package for each component you want. Its peer dependencies —
            <code class="font-mono">&#64;dynamong/core</code> and <code class="font-mono">&#64;dynamong/utils</code>
            — resolve automatically (npm installs peer dependencies by default).
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
          ><code>npm i &#64;dynamong/button</code></pre>
        </section>

        <section>
          <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">2. Project setup</h3>
          <p class="mb-2 text-sm text-text-muted">
            In your global stylesheet, pull in Tailwind and DynamoNG's Tailwind preset (it maps the
            <code class="font-mono">--dg-*</code> theme variables described below onto Tailwind's
            <code class="font-mono">&#64;theme</code> scale):
          </p>
          <pre
            class="mb-4 overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
          ><code>&#64;import "tailwindcss";
&#64;import "&#64;dynamong/theme/tailwind-preset/preset.css";</code></pre>
          <p class="mb-2 text-sm text-text-muted">Then import a compiled theme — e.g. the built-in Aura preset:</p>
          <pre
            class="mb-4 overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
          ><code>&#64;import "&#64;dynamong/theme-aura/theme.css";</code></pre>
          <p class="mb-2 text-sm text-text-muted">
            And register DynamoNG's config once in <code class="font-mono">app.config.ts</code>:
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
          ><code>import &#123; provideDynamoNG &#125; from '&#64;dynamong/core/config';

providers: [provideDynamoNG(&#123; theme: 'aura' &#125;)]</code></pre>
        </section>

        <section>
          <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">3. Using a component</h3>
          <p class="mb-2 text-sm text-text-muted">
            Every component is a standalone Angular component — import the class directly, add it to your own
            component's <code class="font-mono">imports</code> array, and use its selector in your template. No
            NgModule required.
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
          ><code>import &#123; DynamoButton &#125; from '&#64;dynamong/button';

&#64;Component(&#123;
  imports: [DynamoButton],
  template: &#96;&lt;dg-button severity="primary"&gt;Save&lt;/dg-button&gt;&#96;,
&#125;)</code></pre>
        </section>

        <section>
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">4. Theming</h3>

          <div class="space-y-4">
            <div>
              <h4 class="mb-2 font-semibold text-text-primary">The token pipeline</h4>
              <p class="mb-2 text-sm text-text-muted">
                Every colour, surface, radius, spacing, typography, elevation, motion, focus-ring and
                z-index value used across DynamoNG's components traces back to one set of design tokens
                (see the <a routerLink="/foundations" class="text-primary underline">Foundations</a> page
                for the full contract, rendered):
              </p>
              <pre
                class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
              ><code>design tokens (&#64;dynamong/theme/tokens)
  &#8594; compiled to --dg-* CSS custom properties per theme (e.g. &#64;dynamong/theme-aura)
  &#8594; mapped onto Tailwind's &#64;theme scale (&#64;dynamong/theme/tailwind-preset)
  &#8594; consumed via ordinary Tailwind classes inside each component (bg-primary, text-text-primary, ...)</code></pre>
            </div>

            <div>
              <h4 class="mb-2 font-semibold text-text-primary">Overriding tokens</h4>
              <p class="mb-2 text-sm text-text-muted">
                Swapping a theme means redefining <code class="font-mono">--dg-*</code> custom properties — never
                touching a component's template or styles. Add your overrides after the theme import:
              </p>
              <pre
                class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
              ><code>:root &#123;
  --dg-color-primary: #16a34a;
  --dg-color-primary-hover: #15803d;
&#125;</code></pre>
            </div>

            <div>
              <h4 class="mb-2 font-semibold text-text-primary">Building a custom preset</h4>
              <p class="mb-2 text-sm text-text-muted">
                For a full theme of your own, compile a complete <code class="font-mono">DynamoThemeTokens</code>
                object (colors, radii, focus ring) to CSS with the same compiler the built-in presets use:
              </p>
              <pre
                class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
              ><code>import &#123; compileThemeCss &#125; from '&#64;dynamong/theme/tokens';

const css = compileThemeCss(myLightTokens, &#123; dark: myDarkTokens &#125;);
// css is a plain string of ":root &#123; --dg-color-primary: ...; &#125;" — write it
// to a file, or inject it as a &lt;style&gt; tag at bootstrap.</code></pre>
            </div>

            <div>
              <h4 class="mb-2 font-semibold text-text-primary">Dark mode</h4>
              <p class="mb-2 text-sm text-text-muted">
                A compiled theme's dark values live under a <code class="font-mono">.dark</code> selector, but
                DynamoNG has no built-in toggle — add or remove the class yourself, e.g. from a preference:
              </p>
              <pre
                class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
              ><code>const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('dark', prefersDark);</code></pre>
            </div>

            <div>
              <h4 class="mb-2 font-semibold text-text-primary">Per-component escape hatches</h4>
              <p class="mb-2 text-sm text-text-muted">
                Every component also accepts <code class="font-mono">styleClass</code> (extra classes merged onto
                the component) and <code class="font-mono">unstyled</code> (opts out of DynamoNG's built-in
                classes entirely, for a from-scratch look):
              </p>
              <pre
                class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
              ><code>&lt;dg-button styleClass="w-full"&gt;Sign in&lt;/dg-button&gt;
&lt;dg-button [unstyled]="true" styleClass="my-own-button-class"&gt;Sign in&lt;/dg-button&gt;</code></pre>
              <p class="mt-2 text-sm text-text-muted">
                A third input, <code class="font-mono">pt</code> (pass-through), is reserved on every component
                for targeting individual internal parts by name rather than only the root element, as more
                components grow multi-part internals worth customizing independently.
              </p>
            </div>
          </div>
        </section>
      </article>

      <article class="space-y-4">
        <h2 class="text-xl font-bold text-text-primary">Browse components</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          @for (entry of components; track entry.slug) {
            <a
              [routerLink]="['/components', entry.slug]"
              class="block rounded-lg border border-border p-4 transition-colors hover:border-primary"
            >
              <h3 class="font-semibold text-text-primary">{{ entry.name }}</h3>
              <p class="mt-1 text-sm text-text-muted">{{ entry.description }}</p>
            </a>
          }
        </div>
      </article>
    </div>
  `,
})
export class ComponentsIndexPage {
  protected readonly components = COMPONENT_REGISTRY;
}
