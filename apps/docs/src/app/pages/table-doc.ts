import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTable } from '@dynamong/table';
import type { DynamoTableColumn } from '@dynamong/table';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

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

const EXAMPLES: DocExampleRef[] = [
  { id: 'sort-filter-select', title: 'Sort, Filter, Select' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

const API: ApiTableRow[] = [
  { name: 'columns', type: 'DynamoTableColumn<TRow>[] (required)', default: '—' },
  { name: 'data', type: 'readonly TRow[] (required)', default: '—' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'emptyMessage', type: 'string', default: "'No data'" },
  { name: 'pageSize', type: 'number | undefined (model)', default: 'undefined' },
  { name: 'page', type: 'number (model, 1-indexed)', default: '1' },
  { name: 'selectable', type: 'boolean', default: 'false' },
  { name: 'selected', type: 'TRow[] (model)', default: '[]' },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterText', type: 'string (model)', default: "''" },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '40' },
  { name: 'virtualScrollHeight', type: 'number', default: '400' },
];

@Component({
  selector: 'docs-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTable, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Table"
      description="A data table driven by a plain column-definition array, with sorting, pagination (via DynamoPagination), row selection (via DynamoCheckbox), and global filtering (via DynamoInputText)."
      [examples]="examples"
    >
      <docs-example
        exampleId="sort-filter-select"
        title="Sort, Filter, Select"
        description="Sortable columns, a page size, row-selection checkboxes and a global filter box — all opt-in via inputs."
      >
        <div preview>
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
          &lt;dg-table [columns]="columns" [data]="rows" [pageSize]="2"
          [(page)]="page" [selectable]="true" [(selected)]="selected"
          [filterable]="true" [(filterText)]="filterText" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="virtualScroll renders a role=&quot;table&quot; CSS grid where only a small window mounts; sorting still works, pagination and selection do not (v1)."
      >
        <div preview>
          <dg-table
            [columns]="columns"
            [data]="manyRows"
            ariaLabel="Employees (virtualized)"
            [virtualScroll]="true"
          />
          <p class="mt-2 text-sm text-text-muted">
            5,000 rows — only a small rendered window ever mounts in the DOM.
          </p>
        </div>
        <div code>
          &lt;dg-table [columns]="columns" [data]="manyRows"
          [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">virtualScroll</code> renders a
          <code class="font-mono">role="table"</code> CSS Grid, not a real
          <code class="font-mono">&lt;table&gt;</code>. Equal-width columns only
          in v1. Mutually exclusive with
          <code class="font-mono">pageSize</code> and not supported together with
          <code class="font-mono">selectable</code>.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class TableDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly columns = COLUMNS;
  protected readonly rows = ROWS;
  protected readonly manyRows = MANY_ROWS;
  protected readonly page = signal(1);
  protected readonly selected = signal<DocEmployee[]>([]);
  protected readonly filterText = signal('');
}
