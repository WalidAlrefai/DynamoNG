import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoTreeTable } from '@dynamong/tree-table';
import type {
  DynamoTreeTableColumn,
  DynamoTreeTableColumnFilterContext,
  DynamoTreeTableLazyLoadEvent,
  DynamoTreeTableNode,
} from '@dynamong/tree-table';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

interface FileRow {
  name: string;
  size: string;
  modified: string;
}

const COLUMNS: DynamoTreeTableColumn<FileRow>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'size', header: 'Size', sortable: true },
  { field: 'modified', header: 'Modified', sortable: true },
];

const ITEMS: DynamoTreeTableNode<FileRow>[] = [
  {
    id: 'docs',
    data: { name: 'Documents', size: '—', modified: '2026-08-01' },
    children: [
      {
        id: 'resume',
        data: { name: 'Resume.pdf', size: '120 KB', modified: '2026-08-14' },
      },
      {
        id: 'cover',
        data: {
          name: 'Cover Letter.pdf',
          size: '80 KB',
          modified: '2026-07-30',
        },
      },
    ],
  },
  {
    id: 'photos',
    data: { name: 'Photos', size: '—', modified: '2026-08-20' },
    children: [
      {
        id: 'vacation',
        data: { name: 'Vacation', size: '—', modified: '2026-08-22' },
        children: [
          {
            id: 'beach',
            data: { name: 'Beach.jpg', size: '2.4 MB', modified: '2026-08-22' },
          },
          {
            id: 'mountain',
            data: {
              name: 'Mountain.jpg',
              size: '3.1 MB',
              modified: '2026-08-23',
            },
          },
        ],
      },
      {
        id: 'family',
        data: { name: 'Family.jpg', size: '1.8 MB', modified: '2026-08-25' },
      },
    ],
  },
  {
    id: 'notes',
    data: { name: 'Notes.txt', size: '2 KB', modified: '2026-09-01' },
  },
];

// Shown via `{{ }}` interpolation, not literal template text — a raw `{`
// in static Angular template text is parsed as ICU expansion syntax
// (ng5002 "Invalid ICU message"), not plain text; only the VALUE of an
// interpolated expression is exempt from that parsing.
const COLUMN_FILTERS_COLUMNS_SNIPPET = `// columns: [
//   { field: 'name', header: 'Name', columnFilter: { type: 'custom' }, filterTemplate: typeFilterTpl },
//   { field: 'size', header: 'Size', columnFilter: { placeholder: 'Filter size...' } },
// ]`;

function fileType(name: string): string {
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.jpg') || name.endsWith('.png')) return 'image';
  if (name.endsWith('.txt')) return 'text';
  return '';
}

// Shown via `{{ }}` interpolation — see the ICU-parsing note above.
const LAZY_LOADING_SNIPPET = `<dg-tree-table
  [items]="lazyItems()"
  [columns]="columns"
  [lazy]="true"
  [totalRecords]="lazyTotal()"
  [loading]="lazyLoading()"
  [pageSize]="10"
  (lazyLoad)="onTopLevelLazyLoad($event)"
  (nodeExpand)="onNodeExpand($event)"
/>

protected onTopLevelLazyLoad(event: DynamoTreeTableLazyLoadEvent): void {
  this.lazyLoading.set(true);
  fetchFolderPage(event).then((rows) => {
    this.lazyItems.set(rows);
    this.lazyLoading.set(false);
  });
}

protected onNodeExpand(node: DynamoTreeTableNode<FileRow>): void {
  fetchFolderChildren(node).then((children) => {
    this.lazyItems.update((items) =>
      items.map((item) => (item.id === node.id ? { ...item, children } : item)),
    );
  });
}`;

const LAZY_FOLDER_COUNT = 47;

function lazyFolderNode(index: number): DynamoTreeTableNode<FileRow> {
  return {
    id: `folder-${index}`,
    data: { name: `Folder ${index}`, size: '—', modified: '2026-09-01' },
    leaf: false,
  };
}

const VIRTUAL_ITEMS: DynamoTreeTableNode<FileRow>[] = Array.from(
  { length: 2000 },
  (_, i) => ({
    id: `file-${i}`,
    data: {
      name: `File ${i}.txt`,
      size: `${i + 1} KB`,
      modified: '2026-09-01',
    },
  }),
);

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'selection', title: 'Selection' },
  { id: 'filter-paginate', title: 'Filter & Paginate' },
  { id: 'column-filters', title: 'Per-Column Filtering' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
  { id: 'lazy-loading', title: 'Lazy Loading' },
  { id: 'accessibility', title: 'Accessibility' },
];

const API: ApiTableRow[] = [
  {
    name: 'items',
    type: 'DynamoTreeTableNode<TRow>[] (required)',
    default: '—',
  },
  {
    name: 'columns',
    type: 'DynamoTreeTableColumn<TRow>[] (required)',
    default: '—',
  },
  { name: 'expandedIds', type: 'string[] (model)', default: '[]' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'fluid', type: 'boolean', default: 'true' },
  { name: 'emptyMessage', type: 'string', default: "'No data'" },
  { name: 'selectable', type: 'boolean', default: 'false' },
  { name: 'selected', type: 'string[] (model)', default: '[]' },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterText', type: 'string (model)', default: "''" },
  { name: 'noMatchesMessage', type: 'string', default: "'No matching rows'" },
  {
    name: 'columnFilters',
    type: 'Record<string, unknown> (model)',
    default: '{}',
  },
  {
    name: 'pageSize',
    type: 'number | undefined (model)',
    default: 'undefined',
  },
  { name: 'page', type: 'number (model, 1-indexed)', default: '1' },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '40' },
  { name: 'virtualScrollHeight', type: 'number', default: '400' },
  { name: 'lazy', type: 'boolean', default: 'false' },
  { name: 'totalRecords', type: 'number | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-tree-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTreeTable, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="TreeTable"
      description="A hierarchical table — Tree's expand/collapse rows combined with Table's columns, sorting, filtering, and pagination — for data like a file system or org chart."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Each node has an id, a data row, and optional children; the first column's cell renders the expand/collapse chevron. Sorting a column sorts each level's siblings independently."
      >
        <div preview>
          <dg-tree-table
            [items]="items"
            [columns]="columns"
            [(expandedIds)]="expanded"
            ariaLabel="Files"
          />
        </div>
        <div code>
          &lt;dg-tree-table [items]="items" [columns]="columns"
          [(expandedIds)]="expanded" ariaLabel="Files" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="selection"
        title="Selection"
        description="selectable renders a cascading checkbox column — checking a branch checks its enabled descendants, matching DynamoTree's own selection model. itemSelect fires the full node once per direct check/uncheck, not per cascaded descendant or from the header's select-all."
      >
        <div preview>
          <dg-tree-table
            [items]="items"
            [columns]="columns"
            [(expandedIds)]="expanded"
            [selectable]="true"
            [(selected)]="checkedIds"
            ariaLabel="Files"
            (itemSelect)="onItemSelect($event)"
          />
          <p class="mt-2 text-sm text-text-muted">
            Checked: <span class="font-mono">{{ checkedIds().length }}</span>
            @if (lastSelected(); as node) {
              — last toggled:
              <span class="font-mono">{{ node.data.name }}</span>
            }
          </p>
        </div>
        <div code>
          &lt;dg-tree-table [items]="items" [columns]="columns"
          [selectable]="true" [(selected)]="checkedIds"
          (itemSelect)="onItemSelect($event)" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="filter-paginate"
        title="Filter & Paginate"
        description="filterable renders a search box that prunes the tree down to matches and their ancestor chain (a match keeps its whole subtree); pageSize paginates over ROOT nodes only, never the flattened expanded-row list."
      >
        <div preview>
          <dg-tree-table
            [items]="items"
            [columns]="columns"
            [(expandedIds)]="expanded"
            ariaLabel="Files"
            [filterable]="true"
            [pageSize]="2"
          />
        </div>
        <div code>
          &lt;dg-tree-table [items]="items" [columns]="columns"
          [filterable]="true" [pageSize]="2" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="column-filters"
        title="Per-Column Filtering"
        description="Give a column its own columnFilter to render a second header row scoped to just that column — composes with the global filter as a logical AND, in a single hierarchy-aware pass. Size uses the built-in text input; Name uses a custom filterTemplate (a file-type dropdown)."
      >
        <div preview>
          <ng-template #typeFilter let-value let-setValue="setValue">
            <select
              [value]="value ?? ''"
              (change)="setValue($any($event.target).value)"
            >
              <option value="">All types</option>
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="text">Text</option>
            </select>
          </ng-template>
          <dg-tree-table
            [items]="items"
            [columns]="columnFilterColumns()"
            ariaLabel="Files (per-column filters)"
            [(columnFilters)]="columnFilters"
          />
        </div>
        <div code>
          &lt;dg-tree-table [items]="items" [columns]="columns"
          [(columnFilters)]="columnFilters" /&gt;

          {{ columnFiltersColumnsSnippet }}
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="virtualScroll renders only the rows near the viewport via @dynamong/virtual-scroll — 2,000 flat rows here. The roving-tabindex keyboard model (Arrow keys, Home, End) still works: moving to a row outside the mounted range scrolls the viewport to it first, then focuses it once rendered."
      >
        <div preview>
          <dg-tree-table
            [items]="virtualItems"
            [columns]="columns"
            ariaLabel="Files (virtual scroll)"
            [virtualScroll]="true"
            [virtualScrollHeight]="320"
          />
        </div>
        <div code>
          &lt;dg-tree-table [items]="items" [columns]="columns"
          [virtualScroll]="true" [virtualScrollHeight]="320" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="lazy-loading"
        title="Lazy Loading"
        description="lazy + totalRecords + (lazyLoad) drive root-level paging against a fake server (500ms delay, 47 folders). Every folder is also leaf: false with no children yet — expanding one emits (nodeExpand), which fetches that folder's files on demand after its own short delay."
      >
        <div preview>
          <dg-tree-table
            [items]="lazyItems()"
            [columns]="columns"
            ariaLabel="Folders (lazy)"
            [lazy]="true"
            [totalRecords]="lazyTotal()"
            [loading]="lazyLoading()"
            [pageSize]="10"
            (lazyLoad)="onTopLevelLazyLoad($event)"
            (nodeExpand)="onNodeExpand($event)"
          />
        </div>
        <div code>{{ lazyLoadingSnippet }}</div>
      </docs-example>

      <section id="accessibility" class="space-y-3">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Accessibility
        </h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-text-primary">
          <li>
            <code class="font-mono">role="treegrid"</code> root,
            <code class="font-mono">role="row"</code> on every
            <code class="font-mono">&lt;tr&gt;</code> (header included),
            <code class="font-mono">role="gridcell"</code> on every
            <code class="font-mono">&lt;td&gt;</code>, with
            <code class="font-mono">aria-level</code>/<code class="font-mono"
              >aria-expanded</code
            >
            on data rows — the row-navigation-only treegrid variant, not full 2D
            cell navigation.
          </li>
          <li>
            Keyboard: <code class="font-mono">ArrowDown</code>/<code
              class="font-mono"
              >ArrowUp</code
            >
            move, <code class="font-mono">ArrowRight</code> expands (or moves
            into the first child), <code class="font-mono">ArrowLeft</code>
            collapses (or moves to the parent),
            <code class="font-mono">Home</code>/<code class="font-mono"
              >End</code
            >
            jump, <code class="font-mono">Enter</code>/<code class="font-mono"
              >Space</code
            >
            toggles expansion and (while selectable) that row's checkbox.
          </li>
          <li>
            The expand/collapse chevron is a real
            <code class="font-mono">&lt;button&gt;</code> with its own
            accessible name (e.g. "Expand Resume.pdf") — not just a clickable
            icon. It's excluded from the Tab sequence (<code class="font-mono"
              >tabindex="-1"</code
            >) since the row itself is already the roving tab stop, but remains
            reachable by touch-AT (VoiceOver/TalkBack) and
            voice-control/switch-access.
          </li>
          <li>
            Every sortable column header carries an explicit
            <code class="font-mono">aria-sort="none"</code> when it isn't the
            active sort key, rather than omitting the attribute — so assistive
            tech can distinguish "sortable, not currently sorted" from "not
            sortable at all."
          </li>
        </ul>
      </section>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">DynamoTreeTableNode</code>:
          <code class="font-mono">id</code> (required),
          <code class="font-mono">data</code> (your row shape),
          <code class="font-mono">children?</code>,
          <code class="font-mono">disabled?</code>.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class TreeTableDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly columns = COLUMNS;
  protected readonly items = ITEMS;
  protected readonly virtualItems = VIRTUAL_ITEMS;
  protected readonly expanded = signal<string[]>(['docs']);
  protected readonly checkedIds = signal<string[]>([]);
  protected readonly lastSelected = signal<DynamoTreeTableNode<FileRow> | null>(
    null,
  );

  private readonly typeFilterTpl =
    viewChild.required<
      TemplateRef<DynamoTreeTableColumnFilterContext<FileRow>>
    >('typeFilter');
  protected readonly columnFilters = signal<Record<string, unknown>>({});
  protected readonly columnFiltersColumnsSnippet =
    COLUMN_FILTERS_COLUMNS_SNIPPET;
  protected readonly columnFilterColumns = computed<
    DynamoTreeTableColumn<FileRow>[]
  >(() => [
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      columnFilter: {
        type: 'custom',
        predicate: (row, value) => fileType(row.name) === value,
      },
      filterTemplate: this.typeFilterTpl(),
    },
    {
      field: 'size',
      header: 'Size',
      sortable: true,
      columnFilter: { placeholder: 'Filter size...' },
    },
    { field: 'modified', header: 'Modified', sortable: true },
  ]);

  protected onItemSelect(node: DynamoTreeTableNode<FileRow>): void {
    this.lastSelected.set(node);
  }

  protected readonly lazyLoadingSnippet = LAZY_LOADING_SNIPPET;
  protected readonly lazyItems = signal<DynamoTreeTableNode<FileRow>[]>(
    Array.from({ length: 10 }, (_, i) => lazyFolderNode(i)),
  );
  protected readonly lazyTotal = signal(LAZY_FOLDER_COUNT);
  protected readonly lazyLoading = signal(false);

  protected onTopLevelLazyLoad(event: DynamoTreeTableLazyLoadEvent): void {
    this.lazyLoading.set(true);
    setTimeout(() => {
      const start = (event.page - 1) * event.pageSize;
      const rows = Array.from({ length: event.pageSize }, (_, i) =>
        lazyFolderNode(start + i),
      ).filter((_, i) => start + i < LAZY_FOLDER_COUNT);
      this.lazyItems.set(rows);
      this.lazyLoading.set(false);
    }, 500);
  }

  protected onNodeExpand(node: DynamoTreeTableNode<FileRow>): void {
    setTimeout(() => {
      const children: DynamoTreeTableNode<FileRow>[] = Array.from(
        { length: 3 },
        (_, i) => ({
          id: `${node.id}-file-${i}`,
          data: {
            name: `file-${i}.txt`,
            size: `${i + 1} KB`,
            modified: '2026-09-02',
          },
        }),
      );
      this.lazyItems.update((items) =>
        items.map((item) =>
          item.id === node.id ? { ...item, children } : item,
        ),
      );
    }, 500);
  }
}
