import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shared chrome for one entry on the Templates page: title, description, a
 * "Demo" card for the live composed page, and a "Code" card for its
 * snippet — the same shape as `DocPageShell`. There's no single component's
 * API to document for a multi-component template, so the `[api]` slot is
 * replaced with a `[components]` slot: a "Components Used" chip list naming
 * every `@dynamong/*` piece the template composes.
 */
@Component({
  selector: 'docs-template-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="space-y-6">
      <header>
        <h2 class="text-2xl font-bold text-text-primary">{{ name() }}</h2>
        <p class="mt-1 text-text-muted">{{ description() }}</p>
      </header>

      <section>
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Demo</h3>
        <div class="rounded-lg border border-border p-6">
          <ng-content select="[demo]" />
        </div>
      </section>

      <section>
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Code</h3>
        <pre
          class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
        ><code><ng-content select="[code]" /></code></pre>
      </section>

      <section>
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Components Used</h3>
        <div class="flex flex-wrap gap-2">
          <ng-content select="[components]" />
        </div>
      </section>
    </article>
  `,
})
export class TemplateSection {
  readonly name = input.required<string>();
  readonly description = input.required<string>();
}
