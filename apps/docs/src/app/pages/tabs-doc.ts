import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTab, DynamoTabs } from '@dynamong/tabs';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'scrollable', title: 'Scrollable' },
  { id: 'vertical', title: 'Vertical' },
  { id: 'closable', title: 'Closable' },
];

@Component({
  selector: 'docs-tabs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTabs, DynamoTab, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Tabs"
      description="A tabbed content switcher with full keyboard navigation and ARIA tabs semantics."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description='Each <dg-tab> has a value and label; [(value)] is the active tab. activation="automatic" selects on arrow-key focus.'
      >
        <div preview>
          <dg-tabs [(value)]="activeTab">
            <dg-tab value="profile" label="Profile">
              <p class="text-text-primary">
                Manage your personal profile details here.
              </p>
            </dg-tab>
            <dg-tab value="settings" label="Settings">
              <p class="text-text-primary">
                Configure application preferences here.
              </p>
            </dg-tab>
            <dg-tab value="billing" label="Billing" [disabled]="true">
              <p class="text-text-primary">
                Billing is not available on this plan.
              </p>
            </dg-tab>
          </dg-tabs>
        </div>
        <div code>
          &lt;dg-tabs [(value)]="active"&gt; &lt;dg-tab value="profile"
          label="Profile"&gt;...&lt;/dg-tab&gt; &lt;/dg-tabs&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="scrollable"
        title="Scrollable"
        description="scrollable lets the tablist scroll horizontally instead of wrapping when there are more tabs than fit on one line; showNavigators (on by default) adds prev/next scroll buttons."
      >
        <div preview class="max-w-xs">
          <dg-tabs [(value)]="scrollableTab" [scrollable]="true">
            @for (item of manyTabs; track item) {
              <dg-tab [value]="item" [label]="item">
                <p class="text-text-primary">{{ item }} content.</p>
              </dg-tab>
            }
          </dg-tabs>
        </div>
        <div code>
          &lt;dg-tabs [(value)]="active" [scrollable]="true"&gt; ...
          &lt;/dg-tabs&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="vertical"
        title="Vertical"
        description="orientation='vertical' stacks the tablist as a side rail; verticalWidth sets the rail's width. ArrowUp/ArrowDown move focus (ArrowLeft/ArrowRight still work too)."
      >
        <div preview>
          <dg-tabs
            [(value)]="verticalTab"
            orientation="vertical"
            [verticalWidth]="160"
          >
            <dg-tab value="profile" label="Profile">
              <p class="text-text-primary">
                Manage your personal profile details here.
              </p>
            </dg-tab>
            <dg-tab value="settings" label="Settings">
              <p class="text-text-primary">
                Configure application preferences here.
              </p>
            </dg-tab>
            <dg-tab value="billing" label="Billing">
              <p class="text-text-primary">Manage your billing plan here.</p>
            </dg-tab>
          </dg-tabs>
        </div>
        <div code>
          &lt;dg-tabs [(value)]="active" orientation="vertical"&gt; ...
          &lt;/dg-tabs&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="closable"
        title="Closable"
        description="closable on a dg-tab renders a close (×) affordance; clicking it (or pressing Delete/Backspace while it's focused) fires (tabClose) with that tab's value — you remove it from your own data."
      >
        <div preview>
          <dg-tabs [(value)]="closableTab" (tabClose)="onTabClose($event)">
            @for (item of closableTabs(); track item.value) {
              <dg-tab
                [value]="item.value"
                [label]="item.label"
                [closable]="true"
              >
                <p class="text-text-primary">{{ item.label }} content.</p>
              </dg-tab>
            }
          </dg-tabs>
        </div>
        <div code>
          &lt;dg-tab value="a" label="A" [closable]="true"&gt;...&lt;/dg-tab&gt;
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
              <td class="py-2 pr-4 font-mono">dg-tabs</td>
              <td class="py-2 pr-4 font-mono">value</td>
              <td class="py-2 pr-4 font-mono">string | undefined (model)</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tabs</td>
              <td class="py-2 pr-4 font-mono">activation</td>
              <td class="py-2 pr-4 font-mono">'manual' | 'automatic'</td>
              <td class="py-2 font-mono">'manual'</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tabs</td>
              <td class="py-2 pr-4 font-mono">scrollable</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tabs</td>
              <td class="py-2 pr-4 font-mono">showNavigators</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">true</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tabs</td>
              <td class="py-2 pr-4 font-mono">orientation</td>
              <td class="py-2 pr-4 font-mono">'horizontal' | 'vertical'</td>
              <td class="py-2 font-mono">'horizontal'</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tabs</td>
              <td class="py-2 pr-4 font-mono">verticalWidth</td>
              <td class="py-2 pr-4 font-mono">number</td>
              <td class="py-2 font-mono">200</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tabs</td>
              <td class="py-2 pr-4 font-mono">tabClose (output)</td>
              <td class="py-2 pr-4 font-mono">string</td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tab</td>
              <td class="py-2 pr-4 font-mono">value / label</td>
              <td class="py-2 pr-4 font-mono">string (required)</td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-tab</td>
              <td class="py-2 pr-4 font-mono">disabled</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">dg-tab</td>
              <td class="py-2 pr-4 font-mono">closable</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
          </tbody>
        </table>
      </div>
    </docs-examples-layout>
  `,
})
export class TabsDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly activeTab = signal<string | undefined>('profile');
  protected readonly scrollableTab = signal<string | undefined>('Tab 1');
  protected readonly manyTabs = Array.from(
    { length: 10 },
    (_, i) => `Tab ${i + 1}`,
  );
  protected readonly verticalTab = signal<string | undefined>('profile');
  protected readonly closableTab = signal<string | undefined>('a');
  protected readonly closableTabs = signal([
    { value: 'a', label: 'Report A' },
    { value: 'b', label: 'Report B' },
    { value: 'c', label: 'Report C' },
  ]);

  protected onTabClose(value: string): void {
    this.closableTabs.update((tabs) => tabs.filter((t) => t.value !== value));
  }
}
