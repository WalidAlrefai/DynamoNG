import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoOrgChart, type DynamoOrgChartNode } from '@dynamong/org-chart';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

interface Person {
  name: string;
  title: string;
}

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'value', type: 'DynamoOrgChartNode[]', default: 'required' },
  { name: 'collapsible', type: 'boolean', default: 'true' },
  { name: 'collapsedIds', type: 'string[] (model)', default: '[]' },
  { name: 'selectable', type: 'boolean', default: 'false' },
  {
    name: 'selectionMode',
    type: "'single' | 'multiple'",
    default: "'single'",
  },
  { name: 'selection', type: 'string[] (model)', default: '[]' },
  { name: 'nodeSelect', type: 'output<DynamoOrgChartNode>', default: '—' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-org-chart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOrgChart, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="OrgChart"
      description="A top-down hierarchy diagram: each node is a box with its children in a connected row beneath. Collapsible subtrees, optional node selection, and a projected node template."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a node tree; a projected <ng-template let-node> renders each box. Togglers collapse subtrees; [selectable] enables single/multiple selection."
      >
        <div preview class="overflow-x-auto py-4">
          <dg-org-chart
            [value]="value()"
            [selectable]="true"
            [(selection)]="selection"
            [(collapsedIds)]="collapsedIds"
            ariaLabel="Acme org chart"
          >
            <ng-template let-node>
              <span class="font-medium text-text-primary">
                {{ node.value.name }}
              </span>
              <span class="text-xs text-text-muted">
                {{ node.value.title }}
              </span>
            </ng-template>
          </dg-org-chart>
          @if (selected(); as person) {
            <p class="mt-4 text-sm text-text-muted">
              Selected: <span class="font-mono">{{ person.name }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-org-chart [value]="nodes" [selectable]="true"
          [(selection)]="selection"&gt; &lt;ng-template let-node&gt;
          &lt;span&gt;name/title from node.value&lt;/span&gt; &lt;/ng-template&gt;
          &lt;/dg-org-chart&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class OrgChartDocPage {
  readonly examples = EXAMPLES;
  readonly apiRows = API;

  readonly value = signal<DynamoOrgChartNode<Person>[]>([
    {
      id: 'ceo',
      label: 'Ada Powell',
      value: { name: 'Ada Powell', title: 'CEO' },
      children: [
        {
          id: 'cto',
          label: 'Bhavana Rao',
          value: { name: 'Bhavana Rao', title: 'CTO' },
          children: [
            {
              id: 'eng-lead',
              label: 'Chris Nolan',
              value: { name: 'Chris Nolan', title: 'Eng Lead' },
              children: [
                {
                  id: 'eng-1',
                  label: 'Dana Kim',
                  value: { name: 'Dana Kim', title: 'Engineer' },
                },
                {
                  id: 'eng-2',
                  label: 'Eli Frost',
                  value: { name: 'Eli Frost', title: 'Engineer' },
                },
              ],
            },
            {
              id: 'design-lead',
              label: 'Farah Odam',
              value: { name: 'Farah Odam', title: 'Design Lead' },
            },
          ],
        },
        {
          id: 'cfo',
          label: 'Gio Bassi',
          value: { name: 'Gio Bassi', title: 'CFO' },
          children: [
            {
              id: 'finance-1',
              label: 'Hana Lund',
              value: { name: 'Hana Lund', title: 'Analyst' },
            },
          ],
        },
      ],
    },
  ]);

  readonly collapsedIds = signal<string[]>([]);
  readonly selection = signal<string[]>([]);

  selected(): Person | null {
    const id = this.selection()[0];
    if (!id) return null;
    const find = (
      nodes: DynamoOrgChartNode<Person>[],
    ): DynamoOrgChartNode<Person> | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const hit = node.children && find(node.children);
        if (hit) return hit;
      }
      return undefined;
    };
    return find(this.value())?.value ?? null;
  }
}
