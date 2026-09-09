import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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

const MANY_ROWS: DocEmployee[] = Array.from({ length: 5000 }, (_, i) => ({
  name: `Employee ${i + 1}`,
  role: i % 2 === 0 ? 'Engineer' : 'Designer',
  status: i % 5 === 0 ? 'Invited' : 'Active',
}));

@Component({
  selector: 'docs-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTable, DocPageShell],
  template: `
    <docs-page-shell
      name="Table"
      description="A data table driven by a plain column-definition array, with sorting, pagination (via DynamoPagination), row selection (via DynamoCheckbox), and global filtering (via DynamoInputText)."
    >
      <div demo>
        <dg-table
          [columns]="columns"
          [data]="rows"
          ariaLabel="Employees"
          [pageSize]="2"
          [(page)]="page"
          [selectable]="true"
          [(selected)]="selected"
          [filterable]="true"
          [(filterText)]="filterText"
        />
      </div>
      <div code>
        &lt;dg-table [columns]="columns" [data]="rows" ariaLabel="Employees"
        [pageSize]="2" [(page)]="page" [selectable]="true"
        [(selected)]="selected" [filterable]="true" [(filterText)]="filterText"
        /&gt;
      </div>
      <div demo>
        <dg-table [columns]="columns" [data]="manyRows" ariaLabel="Employees (virtualized)" [virtualScroll]="true" />
        <p class="mt-2 text-sm text-text-muted">
          5,000 rows — only a small rendered window ever mounts in the DOM. Sorting still works;
          pagination and row selection aren't supported together with <code class="font-mono">virtualScroll</code>
          in v1.
        </p>
      </div>
      <div code>
        &lt;dg-table [columns]="columns" [data]="manyRows" ariaLabel="Employees" [virtualScroll]="true" /&gt;
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
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">trackBy</td>
            <td class="py-2 pr-4 font-mono">
              (row: TRow, index: number) =&gt; unknown
            </td>
            <td class="py-2 font-mono">row reference identity</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">pageSize</td>
            <td class="py-2 pr-4 font-mono">number | undefined (model)</td>
            <td class="py-2 font-mono">undefined (unpaginated)</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">pageSizeOptions</td>
            <td class="py-2 pr-4 font-mono">number[]</td>
            <td class="py-2 font-mono">[10, 25, 50, 100]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">page</td>
            <td class="py-2 pr-4 font-mono">number (model, 1-indexed)</td>
            <td class="py-2 font-mono">1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selectable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selected</td>
            <td class="py-2 pr-4 font-mono">TRow[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">filterable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">filterPlaceholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Search...'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">filterText</td>
            <td class="py-2 pr-4 font-mono">string (model)</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">noMatchesMessage</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'No matching rows'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">virtualScroll</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">virtualScrollItemSize</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">40</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">virtualScrollHeight</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">400</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">virtualScroll</code> renders a <code class="font-mono">role="table"</code>
        CSS Grid, not a real <code class="font-mono">&lt;table&gt;</code> — a real
        <code class="font-mono">&lt;tbody&gt;</code> can't have
        <code class="font-mono">@dynamong/virtual-scroll</code>'s viewport
        <code class="font-mono">&lt;div&gt;</code> as a child without the browser foster-parenting it
        out. Equal-width columns only in v1. Mutually exclusive with
        <code class="font-mono">pageSize</code> (renders every sorted/filtered row through the
        viewport instead) and not supported together with <code class="font-mono">selectable</code>.
      </p>
    </docs-page-shell>
  `,
})
export class TableDocPage {
  protected readonly columns = COLUMNS;
  protected readonly rows = ROWS;
  protected readonly manyRows = MANY_ROWS;
  protected readonly page = signal(1);
  protected readonly selected = signal<DocEmployee[]>([]);
  protected readonly filterText = signal('');
}
