import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoPanelMenu } from '@dynamong/panel-menu';
import type { DynamoPanelMenuItem } from '@dynamong/panel-menu';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoPanelMenuItem[] (required)', default: '—' },
  { name: 'expandedPaths', type: 'string[] (model)', default: '[]' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-panel-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPanelMenu, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="PanelMenu"
      description="A vertical, always-visible nested action menu that expands and collapses in place, with full keyboard navigation."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a nested items tree; branches expand in place, indenting their children. expandedPaths tracks open branches by structural position."
      >
        <div preview class="w-64 rounded-md border border-border p-2">
          <dg-panel-menu
            [items]="items"
            [(expandedPaths)]="expanded"
            ariaLabel="Documentation"
            (itemSelect)="lastSelected.set($event.label)"
          />
          @if (lastSelected(); as selected) {
            <p class="mt-2 text-sm text-text-muted">
              Last action: <span class="font-mono">{{ selected }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-panel-menu [items]="items" [(expandedPaths)]="expanded"
          (itemSelect)="onSelect($event)" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">DynamoPanelMenuItem</code>:
          <code class="font-mono">label</code> (required),
          <code class="font-mono">disabled?</code>,
          <code class="font-mono">children?</code>,
          <code class="font-mono">command?</code>.
          <code class="font-mono">expandedPaths</code> tracks expand state by a
          dash-joined chain of child indices, not by an id on the item.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class PanelMenuDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly lastSelected = signal<string | null>(null);
  protected readonly expanded = signal<string[]>(['0']);
  protected readonly items: DynamoPanelMenuItem[] = [
    {
      label: 'Getting Started',
      children: [
        { label: 'Installation' },
        { label: 'Quick Start' },
        {
          label: 'Configuration',
          children: [{ label: 'Themes' }, { label: 'Tokens' }],
        },
      ],
    },
    {
      label: 'Components',
      children: [{ label: 'Forms' }, { label: 'Overlay' }, { label: 'Data' }],
    },
    { label: 'Deprecated', disabled: true, children: [{ label: 'Legacy API' }] },
    { label: 'Changelog' },
  ];
}
