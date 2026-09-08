import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DynamoButton } from '@dynamong/button';

/**
 * The docs app's marketing entry point at `/`. Kept inside the same sidebar
 * shell as every other route (no conditional layout) — the sidebar's own
 * independent scroll region (see app.html) means it doesn't crowd this page.
 */
@Component({
  selector: 'docs-landing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, RouterLink],
  template: `
    <div class="flex min-h-[70vh] flex-col justify-center space-y-6">
      <div class="space-y-3">
        <h1 class="text-4xl font-bold text-text-primary">DynamoNG</h1>
        <p class="max-w-xl text-lg text-text-muted">
          A modern Angular UI component library styled with Tailwind CSS — 58 standalone, zoneless-ready
          components, each independently installable, themeable through a handful of CSS custom properties,
          and built with full keyboard navigation and ARIA semantics from the start.
        </p>
      </div>
      <div class="flex gap-3">
        <dg-button severity="primary" [routerLink]="['/components']">Components</dg-button>
        <dg-button severity="primary" variant="outline" [routerLink]="['/templates']">Templates</dg-button>
      </div>
    </div>
  `,
})
export class LandingPage {}
