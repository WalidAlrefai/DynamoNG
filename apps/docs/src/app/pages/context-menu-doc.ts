import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoContextMenu } from '@dynamong/context-menu';
import { DynamoMenuItem, type DynamoMenuItemSelectEvent } from '@dynamong/menu';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'global', title: 'Global' },
];

const API: ApiTableRow[] = [
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'global', type: 'boolean', default: 'false' },
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'ariaLabel', type: 'string | undefined', default: "'Context menu'" },
];

@Component({
  selector: 'docs-context-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoContextMenu,
    DynamoMenuItem,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Context Menu"
      description="A right-click triggered menu positioned at the cursor."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Project the target element then <dg-menu-item> children; right-clicking the target opens the menu at the cursor."
      >
        <div preview>
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
              Last selected: <span class="font-mono">{{ selected.value }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-context-menu (itemSelect)="onSelect($event)"&gt;
          &lt;div&gt;Right-click me&lt;/div&gt; &lt;dg-menu-item value="edit"
          label="Edit" /&gt; &lt;/dg-context-menu&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="global"
        title="Global"
        description="global attaches the contextmenu listener to the whole document — right-clicking anywhere in this preview box opens the menu, not just the dashed region below."
      >
        <div preview>
          <dg-context-menu
            [global]="true"
            (itemSelect)="lastGlobalSelected.set($event)"
          >
            <div
              class="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted"
            >
              Right-click anywhere near here
            </div>
            <dg-menu-item value="refresh" label="Refresh" />
            <dg-menu-item value="settings" label="Settings" />
          </dg-context-menu>
          @if (lastGlobalSelected(); as selected) {
            <p class="mt-2 text-sm text-text-muted">
              Last selected: <span class="font-mono">{{ selected.value }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-context-menu [global]="true"
          (itemSelect)="onSelect($event)"&gt; &lt;div&gt;Page
          content&lt;/div&gt; &lt;dg-menu-item value="refresh" label="Refresh"
          /&gt; &lt;/dg-context-menu&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ContextMenuDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly lastSelected = signal<DynamoMenuItemSelectEvent | null>(
    null,
  );
  protected readonly lastGlobalSelected =
    signal<DynamoMenuItemSelectEvent | null>(null);
}
