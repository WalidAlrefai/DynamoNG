import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shared chrome for every component doc page: title, description, a "Demo"
 * card for the live example, and a "Code" card for its source snippet.
 * Real demo markup and code text are supplied by each page via content
 * projection (`slot="demo"` / `slot="code"`) so this stays presentation-only.
 */
@Component({
  selector: 'docs-page-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-text-primary">{{ name() }}</h1>
        <p class="mt-1 text-text-muted">{{ description() }}</p>
      </header>

      <section>
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Demo</h2>
        <div class="rounded-lg border border-border p-6">
          <ng-content select="[demo]" />
        </div>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Code</h2>
        <pre
          class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
        ><code><ng-content select="[code]" /></code></pre>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">API</h2>
        <ng-content select="[api]" />
      </section>
    </article>
  `,
})
export class DocPageShell {
  readonly name = input.required<string>();
  readonly description = input.required<string>();
}
