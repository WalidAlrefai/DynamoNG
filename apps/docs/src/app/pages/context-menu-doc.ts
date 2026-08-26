import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoContextMenu } from '@dynamong/context-menu';
import { DynamoMenuItem } from '@dynamong/menu';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-context-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoContextMenu, DynamoMenuItem, DocPageShell],
  template: `
    <docs-page-shell
      name="Context Menu"
      description="A right-click triggered menu positioned at the cursor."
    >
      <div demo>
        <dg-context-menu (itemSelect)="lastSelected.set($event)">
          <div
            class="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted"
          >
            Right-click me
          </div>
          <dg-menu-item value="edit" label="Edit" />
          <dg-menu-item value="duplicate" label="Duplicate" />
          <dg-menu-item value="archive" label="Archive" [disabled]="true" />
          <dg-menu-item value="delete" label="Delete" />
        </dg-context-menu>
        @if (lastSelected(); as selected) {
          <p class="mt-2 text-sm text-text-muted">
            Last selected: <span class="font-mono">{{ selected }}</span>
          </p>
        }
      </div>
      <div code>
        &lt;dg-context-menu (itemSelect)="onSelect($event)"&gt;
        &lt;div&gt;Right-click me&lt;/div&gt; &lt;dg-menu-item value="edit"
        label="Edit" /&gt; &lt;/dg-context-menu&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('Context menu')</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ContextMenuDocPage {
  protected readonly lastSelected = signal<string | null>(null);
}
