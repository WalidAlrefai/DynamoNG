import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTree, type DynamoTreeNode } from '@dynamong/tree';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoTreeNode[]', default: 'required' },
  { name: 'expandedIds', type: 'string[] (model)', default: '[]' },
  { name: 'selected', type: 'string[] (model)', default: '[]' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-tree-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTree, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Tree"
      description="A hierarchical, expandable tree with keyboard navigation and multi-select tri-state checkboxes."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a DynamoTreeNode tree; two-way bind [(expandedIds)] and [(selected)]. Checkboxes cascade to descendants with a tri-state parent."
      >
        <div preview>
          <dg-tree
            [items]="items()"
            [(expandedIds)]="expanded"
            [(selected)]="selected"
            ariaLabel="Project files"
          />
        </div>
        <div code>
          &lt;dg-tree [items]="items()" [(expandedIds)]="expanded"
          [(selected)]="selected" ariaLabel="Project files" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class TreeDocPage {
  readonly examples = EXAMPLES;
  readonly apiRows = API;

  readonly items = signal<DynamoTreeNode[]>([
    {
      id: 'src',
      label: 'src',
      children: [
        { id: 'main', label: 'main.ts' },
        { id: 'app', label: 'app.ts' },
      ],
    },
    {
      id: 'docs',
      label: 'docs',
      children: [
        { id: 'readme', label: 'README.md' },
        { id: 'license', label: 'LICENSE', disabled: true },
      ],
    },
    { id: 'gitignore', label: '.gitignore' },
  ]);

  readonly expanded = signal<string[]>(['src']);
  readonly selected = signal<string[]>([]);
}
