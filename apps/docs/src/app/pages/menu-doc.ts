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

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'item-template', title: 'Custom Item Template' },
];

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
        description="Project <dg-menu-item> children with a value and label; (itemSelect) fires the full clicked item ({ value, label, disabled, icon? }). icon renders a short glyph before the label; separator renders a non-interactive divider row. visible: false omits an item from render AND keyboard nav entirely; shortcut renders a display-only trailing hint; badge renders a small trailing dg-badge; routerLink (on a leaf) renders a real <a> instead of a <button>, so middle-click/ctrl-click 'open in new tab' work natively."
      >
        <div preview>
          <dg-menu label="Actions" (itemSelect)="lastSelected.set($event)">
            <dg-menu-item value="edit" label="Edit" icon="✎" shortcut="⌘E" />
            <dg-menu-item value="duplicate" label="Duplicate" icon="⧉" />
            <dg-menu-item value="comments" label="Comments" [badge]="3" />
            <dg-menu-item
              value="hidden"
              label="Hidden for now"
              [visible]="false"
            />
            <dg-menu-item [separator]="true" value="" label="" />
            <dg-menu-item
              value="docs"
              label="Open Badge docs"
              routerLink="/components/badge"
            />
            <dg-menu-item value="archive" label="Archive" [disabled]="true" />
            <dg-menu-item value="delete" label="Delete" icon="🗑" />
          </dg-menu>
          @if (lastSelected(); as selected) {
            <p class="mt-2 text-sm text-text-muted">
              Last selected: <span class="font-mono">{{ selected.value }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-menu label="Actions" (itemSelect)="onSelect($event)"&gt;
          &lt;dg-menu-item value="edit" label="Edit" icon="✎" shortcut="⌘E"
          /&gt; &lt;dg-menu-item value="comments" label="Comments" [badge]="3"
          /&gt; &lt;dg-menu-item [separator]="true" value="" label="" /&gt;
          &lt;dg-menu-item value="docs" label="Open Badge docs"
          routerLink="/components/badge" /&gt; &lt;/dg-menu&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="item-template"
        title="Custom Item Template"
        description="Project an #itemTemplate to replace every row's plain label text with custom markup — icon/shortcut/badge still render around it."
      >
        <div preview>
          <dg-menu label="Account">
            <ng-template #itemTemplate let-item>
              <span class="font-semibold text-primary">{{ item.label() }}</span>
            </ng-template>
            <dg-menu-item value="profile" label="Profile" />
            <dg-menu-item value="billing" label="Billing" />
            <dg-menu-item value="signout" label="Sign out" />
          </dg-menu>
        </div>
        <div code>
          &lt;dg-menu label="Account"&gt; &lt;ng-template #itemTemplate
          let-item&gt; &lt;span class="font-semibold text-primary"&gt;{{ '{{ item.label()
          }}' }} &lt;/span&gt; &lt;/ng-template&gt; &lt;dg-menu-item
          value="profile" label="Profile" /&gt; &lt;/dg-menu&gt;
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
              <td class="py-2 pr-4 font-mono">dg-menu</td>
              <td class="py-2 pr-4 font-mono">ariaDescribedby</td>
              <td class="py-2 pr-4 font-mono">string | undefined</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu</td>
              <td class="py-2 pr-4 font-mono">fluid</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">value / label</td>
              <td class="py-2 pr-4 font-mono">string (required)</td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">disabled</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">icon</td>
              <td class="py-2 pr-4 font-mono">string | undefined</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">separator</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">visible</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">true</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">shortcut</td>
              <td class="py-2 pr-4 font-mono">string | undefined</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">badge</td>
              <td class="py-2 pr-4 font-mono">string | number | undefined</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">dg-menu-item</td>
              <td class="py-2 pr-4 font-mono">
                routerLink / queryParams / fragment
              </td>
              <td class="py-2 pr-4 font-mono">string | string[] | undefined</td>
              <td class="py-2 font-mono">undefined</td>
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
