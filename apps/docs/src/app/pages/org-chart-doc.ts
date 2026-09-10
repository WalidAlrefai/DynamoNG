import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoOrgChart, type DynamoOrgChartNode } from '@dynamong/org-chart';
import { DocPageShell } from '../components/doc-page-shell';

interface Person {
  name: string;
  title: string;
}

@Component({
  selector: 'docs-org-chart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOrgChart, DocPageShell],
  template: `
    <docs-page-shell
      name="OrgChart"
      description="A top-down hierarchy diagram: each node is a box with its children in a connected row beneath. Collapsible subtrees, optional node selection, and a projected node template."
    >
      <div demo class="overflow-x-auto py-4">
        <dg-org-chart
          [value]="value()"
          [selectable]="true"
          [(selection)]="selection"
          [(collapsedIds)]="collapsedIds"
          ariaLabel="Acme org chart"
        >
          <ng-template let-node>
            <span class="font-medium text-text-primary">{{ node.value.name }}</span>
            <span class="text-xs text-text-muted">{{ node.value.title }}</span>
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
        &lt;span&gt;name/title from node.value&lt;/span&gt;
        &lt;/ng-template&gt; &lt;/dg-org-chart&gt;
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
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">DynamoOrgChartNode[]</td>
            <td class="py-2 font-mono">required</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">collapsible</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">collapsedIds</td>
            <td class="py-2 pr-4 font-mono">string[]</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selectable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selectionMode</td>
            <td class="py-2 pr-4 font-mono">'single' | 'multiple'</td>
            <td class="py-2 font-mono">'single'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selection</td>
            <td class="py-2 pr-4 font-mono">string[]</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">nodeSelect</td>
            <td class="py-2 pr-4 font-mono">output&lt;DynamoOrgChartNode&gt;</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class OrgChartDocPage {
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
