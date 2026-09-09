import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTreeTable } from '@dynamong/tree-table';
import type { DynamoTreeTableColumn, DynamoTreeTableNode } from '@dynamong/tree-table';
import { DocPageShell } from '../components/doc-page-shell';

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
      { id: 'resume', data: { name: 'Resume.pdf', size: '120 KB', modified: '2026-08-14' } },
      { id: 'cover', data: { name: 'Cover Letter.pdf', size: '80 KB', modified: '2026-07-30' } },
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
          { id: 'beach', data: { name: 'Beach.jpg', size: '2.4 MB', modified: '2026-08-22' } },
          { id: 'mountain', data: { name: 'Mountain.jpg', size: '3.1 MB', modified: '2026-08-23' } },
        ],
      },
      { id: 'family', data: { name: 'Family.jpg', size: '1.8 MB', modified: '2026-08-25' } },
    ],
  },
  { id: 'notes', data: { name: 'Notes.txt', size: '2 KB', modified: '2026-09-01' } },
];

@Component({
  selector: 'docs-tree-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTreeTable, DocPageShell],
  template: `
    <docs-page-shell
      name="TreeTable"
      description="A hierarchical table — Tree's expand/collapse rows combined with Table's columns and sorting — for data like a file system or org chart."
    >
      <div demo>
        <dg-tree-table [items]="items" [columns]="columns" [(expandedIds)]="expanded" ariaLabel="Files" />
      </div>
      <div code>
        &lt;dg-tree-table [items]="items" [columns]="columns" [(expandedIds)]="expanded" ariaLabel="Files" /&gt;
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
            <td class="py-2 pr-4 font-mono">items</td>
            <td class="py-2 pr-4 font-mono">DynamoTreeTableNode&lt;TRow&gt;[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">columns</td>
            <td class="py-2 pr-4 font-mono">DynamoTreeTableColumn&lt;TRow&gt;[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">expandedIds</td>
            <td class="py-2 pr-4 font-mono">string[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">emptyMessage</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'No data'</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">DynamoTreeTableNode</code>:
        <code class="font-mono">id</code> (required),
        <code class="font-mono">data</code> (your row shape — the first column's cell renders the
        expand/collapse chevron inline before its own content),
        <code class="font-mono">children?</code>,
        <code class="font-mono">disabled?</code>. Sorting a column sorts each level's siblings
        independently, never flattening the hierarchy. No pagination, global filter, or row selection
        in v1 — those are Table's own opt-in features and don't map cleanly onto a tree's hierarchy.
      </p>
    </docs-page-shell>
  `,
})
export class TreeTableDocPage {
  protected readonly columns = COLUMNS;
  protected readonly items = ITEMS;
  protected readonly expanded = signal<string[]>(['docs']);
}
