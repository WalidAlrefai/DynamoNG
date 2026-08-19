import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoTable } from '@dynamong/table';
import type { DynamoTableColumn } from '@dynamong/table';
import { DocPageShell } from '../components/doc-page-shell';

interface DocEmployee {
  name: string;
  role: string;
  status: string;
}

const COLUMNS: DynamoTableColumn<DocEmployee>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'role', header: 'Role', sortable: true },
  { field: 'status', header: 'Status', sortable: true },
];

const ROWS: DocEmployee[] = [
  { name: 'Ava Thompson', role: 'Engineering Lead', status: 'Active' },
  { name: 'Noah Martinez', role: 'Product Designer', status: 'Active' },
  { name: 'Priya Shah', role: 'Backend Engineer', status: 'Invited' },
];

@Component({
  selector: 'docs-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTable, DocPageShell],
  template: `
    <docs-page-shell
      name="Table"
      description="A sortable data table driven by a plain column-definition array, with client-side single-column sorting."
    >
      <div demo>
        <dg-table [columns]="columns" [data]="rows" ariaLabel="Employees" />
      </div>
      <div code>
        &lt;dg-table [columns]="columns" [data]="rows" ariaLabel="Employees"
        /&gt;
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
            <td class="py-2 pr-4 font-mono">columns</td>
            <td class="py-2 pr-4 font-mono">
              DynamoTableColumn&lt;TRow&gt;[] (required)
            </td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">data</td>
            <td class="py-2 pr-4 font-mono">readonly TRow[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">emptyMessage</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'No data'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">trackBy</td>
            <td class="py-2 pr-4 font-mono">
              (row: TRow, index: number) =&gt; unknown
            </td>
            <td class="py-2 font-mono">row reference identity</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class TableDocPage {
  protected readonly columns = COLUMNS;
  protected readonly rows = ROWS;
}
