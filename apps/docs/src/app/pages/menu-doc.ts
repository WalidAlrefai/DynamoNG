import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DynamoMenu,
  DynamoMenuItem,
  type DynamoMenuItemSelectEvent,
} from '@dynamong/menu';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

@Component({
  selector: 'docs-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMenu, DynamoMenuItem, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Menu"
      description="A dropdown action menu positioned by CDK Overlay, with full keyboard navigation and ARIA menu semantics."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Project <dg-menu-item> children with a value and label; (itemSelect) fires the full clicked item ({ value, label, disabled })."
      >
        <div preview>
          <dg-menu label="Actions" (itemSelect)="lastSelected.set($event)">
            <dg-menu-item value="edit" label="Edit" />
            <dg-menu-item value="duplicate" label="Duplicate" />
            <dg-menu-item value="archive" label="Archive" [disabled]="true" />
            <dg-menu-item value="delete" label="Delete" />
          </dg-menu>
          @if (lastSelected(); as selected) {
            <p class="mt-2 text-sm text-text-muted">
              Last selected: <span class="font-mono">{{ selected.value }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-menu label="Actions" (itemSelect)="onSelect($event)"&gt;
          &lt;dg-menu-item value="edit" label="Edit" /&gt; &lt;/dg-menu&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
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
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">value / label</td>
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
      </div>
    </docs-examples-layout>
  `,
})
export class MenuDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly lastSelected = signal<DynamoMenuItemSelectEvent | null>(
    null,
  );
}
