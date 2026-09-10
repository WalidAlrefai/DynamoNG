import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTreeTable } from '@dynamong/tree-table';
import type {
  DynamoTreeTableColumn,
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

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

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
  { name: 'emptyMessage', type: 'string', default: "'No data'" },
];

@Component({
  selector: 'docs-tree-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTreeTable, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="TreeTable"
      description="A hierarchical table — Tree's expand/collapse rows combined with Table's columns and sorting — for data like a file system or org chart."
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

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">DynamoTreeTableNode</code>:
          <code class="font-mono">id</code> (required),
          <code class="font-mono">data</code> (your row shape),
          <code class="font-mono">children?</code>,
          <code class="font-mono">disabled?</code>. No pagination, global filter,
          or row selection in v1.
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
  protected readonly expanded = signal<string[]>(['docs']);
}
