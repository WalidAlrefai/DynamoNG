import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { COMPONENT_REGISTRY } from '../component-registry';

@Component({
  selector: 'docs-home-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">DynamoNG</h1>
        <p class="mt-1 text-text-muted">A modern Angular UI component library styled with Tailwind CSS.</p>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        @for (entry of components; track entry.slug) {
          <a
            [routerLink]="['/components', entry.slug]"
            class="block rounded-lg border border-border p-4 transition-colors hover:border-primary"
          >
            <h2 class="font-semibold text-text-primary">{{ entry.name }}</h2>
            <p class="mt-1 text-sm text-text-muted">{{ entry.description }}</p>
          </a>
        }
      </div>
    </div>
  `,
})
export class HomePage {
  protected readonly components = COMPONENT_REGISTRY;
}
