import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoMenu, DynamoMenuItem } from '@dynamong/menu';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMenu, DynamoMenuItem, DocPageShell],
  template: `
    <docs-page-shell
      name="Menu"
      description="A dropdown action menu positioned by CDK Overlay, with full keyboard navigation and ARIA menu semantics."
    >
      <div demo>
        <dg-menu label="Actions" (itemSelect)="lastSelected.set($event)">
          <dg-menu-item value="edit" label="Edit" />
          <dg-menu-item value="duplicate" label="Duplicate" />
          <dg-menu-item value="archive" label="Archive" [disabled]="true" />
          <dg-menu-item value="delete" label="Delete" />
        </dg-menu>
        @if (lastSelected(); as selected) {
          <p class="mt-2 text-sm text-text-muted">
            Last selected: <span class="font-mono">{{ selected }}</span>
          </p>
        }
      </div>
      <div code>
        &lt;dg-menu label="Actions" (itemSelect)="onSelect($event)"&gt;
        &lt;dg-menu-item value="edit" label="Edit" /&gt; &lt;/dg-menu&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Element</th>
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-menu</td>
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-menu</td>
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">
              'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
            </td>
            <td class="py-2 font-mono">'bottom-start'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-menu</td>
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-menu</td>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-menu-item</td>
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-menu-item</td>
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">dg-menu-item</td>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class MenuDocPage {
  protected readonly lastSelected = signal<string | null>(null);
}
