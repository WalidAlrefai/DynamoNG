import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { DynamoTable } from '@dynamong/table';
import type {
  DynamoTableColumn,
  DynamoTableColumnFilterContext,
  DynamoTableLazyLoadEvent,
} from '@dynamong/table';
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

// Shown via `{{ }}` interpolation, not literal template text — a raw `{`
// in static Angular template text is parsed as the start of ICU expansion
// syntax (ng5002 "Invalid ICU message"), not plain text; only the VALUE of
// an interpolated expression is exempt from that parsing.
const COLUMN_FILTERS_COLUMNS_SNIPPET = `// columns: [
//   { field: 'role', header: 'Role', columnFilter: { placeholder: 'Filter role...' } },
//   { field: 'status', header: 'Status', columnFilter: { type: 'custom' }, filterTemplate: statusFilterTpl },
// ]`;

const LAZY_LOADING_SNIPPET = `<dg-table
  [columns]="columns"
  [data]="lazyRows()"
  [lazy]="true"
  [totalRecords]="lazyTotal()"
  [loading]="lazyLoading()"
  [pageSize]="5"
  (lazyLoad)="onLazyLoad($event)"
/>

protected onLazyLoad(event: DynamoTableLazyLoadEvent): void {
  this.lazyLoading.set(true);
  fetchFromServer(event).then((result) => {
    this.lazyRows.set(result.rows);
    this.lazyTotal.set(result.total);
    this.lazyLoading.set(false);
  });
}`;

const EXAMPLES: DocExampleRef[] = [
  { id: 'sort-filter-select', title: 'Sort, Filter, Select' },
  { id: 'column-filters', title: 'Per-Column Filtering' },
  { id: 'multi-sort', title: 'Multi-Column Sort' },
  { id: 'expandable-rows', title: 'Expandable Rows' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
  { id: 'lazy-loading', title: 'Lazy Loading' },
];

// A fake "server" the lazy-loading example fetches from, simulating a
// dataset too large to ever hold client-side in full.
const LAZY_ALL_ROWS: DocEmployee[] = Array.from({ length: 47 }, (_, i) => ({
  name: `Employee ${i + 1}`,
  role: i % 2 === 0 ? 'Engineer' : 'Designer',
  status: i % 5 === 0 ? 'Invited' : 'Active',
}));

const API: ApiTableRow[] = [
  {
    name: 'columns',
    type: 'DynamoTableColumn<TRow>[] (required)',
    default: '—',
  },
  { name: 'data', type: 'readonly TRow[] (required)', default: '—' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'fluid', type: 'boolean', default: 'true' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'emptyMessage', type: 'string', default: "'No data'" },
  {
    name: 'expansionTemplate',
    type: 'TemplateRef<DynamoTableCellContext<TRow>> | undefined',
    default: 'undefined',
  },
  { name: 'expandedRows', type: 'TRow[] (model)', default: '[]' },
  { name: 'expandMode', type: "'multiple' | 'single'", default: "'multiple'" },
  {
    name: 'pageSize',
    type: 'number | undefined (model)',
    default: 'undefined',
  },
  { name: 'page', type: 'number (model, 1-indexed)', default: '1' },
  { name: 'selectable', type: 'boolean', default: 'false' },
  { name: 'selected', type: 'TRow[] (model)', default: '[]' },
  { name: 'sortMode', type: "'single' | 'multiple'", default: "'single'" },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterText', type: 'string (model)', default: "''" },
  {
    name: 'filterAriaLabel',
    type: 'string',
    default: "'Search table'",
  },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '40' },
  { name: 'virtualScrollHeight', type: 'number', default: '400' },
  { name: 'lazy', type: 'boolean', default: 'false' },
  {
    name: 'totalRecords',
    type: 'number | undefined',
    default: 'undefined',
  },
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
        exampleId="column-filters"
        title="Per-Column Filtering"
        description="Give a column its own columnFilter to render a second header row scoped to just that column — composes with the global filter above as a logical AND. role uses the built-in text input; status uses a custom filterTemplate (a dropdown)."
      >
        <div preview>
          <ng-template #statusFilter let-value let-setValue="setValue">
            <select
              [value]="value ?? ''"
              (change)="setValue($any($event.target).value)"
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Invited">Invited</option>
            </select>
          </ng-template>
          <dg-table
            [columns]="columnFilterColumns()"
            [data]="rows"
            ariaLabel="Employees (per-column filters)"
            [(columnFilters)]="columnFilters"
          />
        </div>
        <div code>
          &lt;dg-table [columns]="columns" [data]="rows"
          [(columnFilters)]="columnFilters" /&gt;

          {{ columnFiltersColumnsSnippet }}
        </div>
      </docs-example>

      <docs-example
        exampleId="multi-sort"
        title="Multi-Column Sort"
        description='sortMode="multiple" — click a column to sort by it alone; shift-click a different column to add it as a secondary key. Try clicking Status, then shift-clicking Name to break ties between the two "Active" rows.'
      >
        <div preview>
          <dg-table
            [columns]="columns"
            [data]="rows"
            ariaLabel="Employees (multi-sort)"
            sortMode="multiple"
          />
        </div>
        <div code>
          &lt;dg-table [columns]="columns" [data]="rows" sortMode="multiple"
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="expandable-rows"
        title="Expandable Rows"
        description="Pass an expansionTemplate to add a chevron column; expandMode='single' makes it accordion-style. Expansion is keyed by row identity, so it survives sorting."
      >
        <div preview>
          <ng-template #detail let-row>
            <p class="text-sm">
              <strong>{{ row.name }}</strong> is currently
              {{ row.status.toLowerCase() }} as {{ row.role }}.
            </p>
          </ng-template>
          <dg-table
            [columns]="columns"
            [data]="rows"
            ariaLabel="Employees (expandable)"
            [expansionTemplate]="detail"
            [(expandedRows)]="expanded"
          />
        </div>
        <div code>
          &lt;ng-template #detail let-row&gt;...&lt;/ng-template&gt;
          &lt;dg-table [columns]="columns" [data]="rows"
          [expansionTemplate]="detail" [(expandedRows)]="expanded" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description='virtualScroll renders a role="table" CSS grid where only a small window mounts; sorting and selection both still work. Not combined with pageSize — a virtualized table always renders every (filtered/sorted) row.'
      >
        <div preview>
          <dg-table
            [columns]="columns"
            [data]="manyRows"
            ariaLabel="Employees (virtualized)"
            [virtualScroll]="true"
            [selectable]="true"
            [(selected)]="virtualSelected"
          />
          <p class="mt-2 text-sm text-text-muted">
            5,000 rows — only a small rendered window ever mounts in the DOM.
          </p>
        </div>
        <div code>
          &lt;dg-table [columns]="columns" [data]="manyRows"
          [virtualScroll]="true" [selectable]="true" [(selected)]="selected"
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="lazy-loading"
        title="Lazy Loading"
        description="lazy hands sorting/filtering/pagination off to your own data source — data holds only the current page's rows, totalRecords drives the page count, and (lazyLoad) fires whenever page/sort/filter changes via Table's own UI. This example simulates a 500ms network fetch against a 47-row fake server."
      >
        <div preview>
          <dg-table
            [columns]="columns"
            [data]="lazyRows()"
            ariaLabel="Employees (lazy-loaded)"
            [lazy]="true"
            [totalRecords]="lazyTotal()"
            [loading]="lazyLoading()"
            [pageSize]="5"
            (lazyLoad)="onLazyLoad($event)"
          />
        </div>
        <div code>{{ lazyLoadingSnippet }}</div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">virtualScroll</code> renders a
          <code class="font-mono">role="table"</code> CSS Grid, not a real
          <code class="font-mono">&lt;table&gt;</code> — not combined with
          <code class="font-mono">pageSize</code> (a virtualized table always
          renders every row).
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
  protected readonly virtualSelected = signal<DocEmployee[]>([]);
  protected readonly expanded = signal<DocEmployee[]>([]);
  protected readonly filterText = signal('');

  private readonly statusFilterTpl =
    viewChild.required<
      TemplateRef<DynamoTableColumnFilterContext<DocEmployee>>
    >('statusFilter');
  protected readonly columnFilters = signal<Record<string, unknown>>({});
  protected readonly columnFiltersColumnsSnippet =
    COLUMN_FILTERS_COLUMNS_SNIPPET;
  protected readonly columnFilterColumns = computed<
    DynamoTableColumn<DocEmployee>[]
  >(() => [
    { field: 'name', header: 'Name' },
    {
      field: 'role',
      header: 'Role',
      columnFilter: { placeholder: 'Filter role...' },
    },
    {
      field: 'status',
      header: 'Status',
      columnFilter: { type: 'custom' },
      filterTemplate: this.statusFilterTpl(),
    },
  ]);

  protected readonly lazyLoadingSnippet = LAZY_LOADING_SNIPPET;
  protected readonly lazyRows = signal<DocEmployee[]>(
    LAZY_ALL_ROWS.slice(0, 5),
  );
  protected readonly lazyTotal = signal(LAZY_ALL_ROWS.length);
  protected readonly lazyLoading = signal(false);

  /** Simulates a 500ms network round-trip against a fake 47-row "server" —
   *  sorts/filters/paginates `LAZY_ALL_ROWS` itself, exactly what a real
   *  backend endpoint would do, then feeds the matching slice back in via
   *  `lazyRows`/`lazyTotal`. */
  protected onLazyLoad(event: DynamoTableLazyLoadEvent): void {
    this.lazyLoading.set(true);
    setTimeout(() => {
      let rows = [...LAZY_ALL_ROWS];
      const query = event.filterText.trim().toLowerCase();
      if (query) {
        rows = rows.filter((row) =>
          Object.values(row).some((value) =>
            String(value).toLowerCase().includes(query),
          ),
        );
      }
      const [primarySort] = event.sort;
      if (primarySort) {
        const field = primarySort.field as keyof DocEmployee;
        rows.sort((a, b) => {
          const cmp = String(a[field]).localeCompare(String(b[field]));
          return primarySort.direction === 'asc' ? cmp : -cmp;
        });
      }
      this.lazyTotal.set(rows.length);
      const start = (event.page - 1) * event.pageSize;
      this.lazyRows.set(rows.slice(start, start + event.pageSize));
      this.lazyLoading.set(false);
    }, 500);
  }
}
