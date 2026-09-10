import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoMenubar } from '@dynamong/menubar';
import type { DynamoMenubarItem } from '@dynamong/menubar';
import { DynamoInputText } from '@dynamong/input-text';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoMenubarItem[] (required)', default: '—' },
  {
    name: 'position',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
  },
  { name: 'openIndex', type: 'number | null (model)', default: 'null' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-menubar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoMenubar,
    DynamoInputText,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Menubar"
      description="An always-visible, top-level horizontal navigation bar — dropdown submenus with nested side-flyout submenus and full keyboard navigation."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a nested items tree; a top-level item with children opens a dropdown, deeper branches flyout. [start]/[end] slots hold a logo or search."
      >
        <div preview>
          <dg-menubar
            [items]="items"
            ariaLabel="Example"
            (itemSelect)="lastSelected.set($event.label)"
          >
            <span start class="pl-2 font-semibold">Acme</span>
            <dg-input-text end placeholder="Search…" ariaLabel="Search" />
          </dg-menubar>
          @if (lastSelected(); as selected) {
            <p class="mt-2 text-sm text-text-muted">
              Last action: <span class="font-mono">{{ selected }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-menubar [items]="items" ariaLabel="Example"
          (itemSelect)="onSelect($event)"&gt; &lt;span start&gt;Acme&lt;/span&gt;
          &lt;dg-input-text end placeholder="Search…" /&gt; &lt;/dg-menubar&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">DynamoMenubarItem</code>:
          <code class="font-mono">label</code> (required),
          <code class="font-mono">disabled?</code>,
          <code class="font-mono">children?</code> (nested items),
          <code class="font-mono">command?</code>. A top-level item with no
          children commits directly. <code class="font-mono">[start]</code> /
          <code class="font-mono">[end]</code> content sits outside the
          <code class="font-mono">role="menubar"</code> element, since ARIA only
          permits menuitem-family children there.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class MenubarDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly lastSelected = signal<string | null>(null);
  protected readonly items: DynamoMenubarItem[] = [
    {
      label: 'File',
      children: [
        {
          label: 'New',
          children: [
            { label: 'Document' },
            { label: 'Spreadsheet' },
            { label: 'Presentation' },
          ],
        },
        { label: 'Export', children: [{ label: 'PDF' }, { label: 'CSV' }] },
        { label: 'Print' },
        { label: 'Share', disabled: true },
      ],
    },
    {
      label: 'Edit',
      children: [
        { label: 'Undo' },
        { label: 'Redo' },
        { label: 'Cut' },
        { label: 'Copy' },
        { label: 'Paste' },
      ],
    },
    {
      label: 'View',
      children: [
        { label: 'Zoom In' },
        { label: 'Zoom Out' },
        { label: 'Fullscreen' },
      ],
    },
    { label: 'Help' },
  ];
}
