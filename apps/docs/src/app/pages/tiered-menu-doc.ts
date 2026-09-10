import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTieredMenu } from '@dynamong/tiered-menu';
import type { DynamoTieredMenuItem } from '@dynamong/tiered-menu';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoTieredMenuItem[] (required)', default: '—' },
  { name: 'label', type: 'string (required)', default: '—' },
  {
    name: 'position',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
  },
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-tiered-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTieredMenu, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Tiered Menu"
      description="A nested multi-level action menu — submenus flyout to the side, with full keyboard navigation across levels."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a nested items tree; a branch item opens a side flyout on hover, click, or ArrowRight."
      >
        <div preview>
          <dg-tiered-menu
            label="File"
            [items]="items"
            (itemSelect)="lastSelected.set($event.label)"
          />
          @if (lastSelected(); as selected) {
            <p class="mt-2 text-sm text-text-muted">
              Last action: <span class="font-mono">{{ selected }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-tiered-menu label="File" [items]="items"
          (itemSelect)="onSelect($event)" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">DynamoTieredMenuItem</code>:
          <code class="font-mono">label</code> (required),
          <code class="font-mono">disabled?</code>,
          <code class="font-mono">children?</code>,
          <code class="font-mono">command?</code>.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class TieredMenuDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly lastSelected = signal<string | null>(null);
  protected readonly items: DynamoTieredMenuItem[] = [
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
  ];
}
