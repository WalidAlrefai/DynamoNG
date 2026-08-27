import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoTreeSelect } from '@dynamong/tree-select';
import type { DynamoTreeNode } from '@dynamong/tree';
import { DocPageShell } from '../components/doc-page-shell';

const NODES: DynamoTreeNode<string>[] = [
  {
    id: 'fruits',
    label: 'Fruits',
    children: [
      { id: 'apple', label: 'Apple', value: 'apple' },
      { id: 'banana', label: 'Banana', value: 'banana' },
    ],
  },
  {
    id: 'veggies',
    label: 'Vegetables',
    children: [
      { id: 'carrot', label: 'Carrot', value: 'carrot', disabled: true },
      { id: 'pea', label: 'Pea', value: 'pea' },
    ],
  },
  { id: 'grain', label: 'Grain', value: 'grain' },
];

@Component({
  selector: 'docs-tree-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTreeSelect, ReactiveFormsModule, DocPageShell],
  template: `
    <docs-page-shell
      name="Tree Select"
      description="A dropdown combobox whose panel shows a hierarchical, expandable tree."
    >
      <div demo class="max-w-xs">
        <dg-tree-select
          [nodes]="nodes"
          [formControl]="category"
          ariaLabel="Category"
        />
        <p class="mt-2 text-sm text-text-muted">
          Value: <span class="font-mono">{{ category.value ?? '(none)' }}</span>
        </p>
      </div>
      <div code>&lt;dg-tree-select [nodes]="nodes" [formControl]="category" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">nodes</td>
            <td class="py-2 pr-4 font-mono">DynamoTreeNode[]</td>
            <td class="py-2 font-mono">required</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">placeholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Select...'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class TreeSelectDocPage {
  protected readonly nodes = NODES;
  protected readonly category = new FormControl<string | null>(null);
}
