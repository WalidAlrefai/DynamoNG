import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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

// One deep, flat branch of 5,000 leaves — enough that only a small
// rendered window ever mounts once the branch is expanded.
const MANY_NODES: DynamoTreeNode<string>[] = [
  {
    id: 'all',
    label: 'All items (5,000)',
    children: Array.from({ length: 5000 }, (_, i) => ({
      id: `item-${i + 1}`,
      label: `Item ${i + 1}`,
      value: `item-${i + 1}`,
    })),
  },
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
      <div demo class="max-w-xs">
        <dg-tree-select
          [nodes]="manyNodes"
          [(value)]="manyValue"
          [virtualScroll]="true"
          ariaLabel="Item (virtualized)"
          placeholder="Expand to browse 5,000 items"
        />
        <p class="mt-2 text-sm text-text-muted">
          Expand the branch — the 5,000 leaves render through
          <code class="font-mono">@dynamong/virtual-scroll</code>, so only a small window mounts.
        </p>
      </div>
      <div code>
        &lt;dg-tree-select [nodes]="manyNodes" [(value)]="manyValue"
        [virtualScroll]="true" /&gt;
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
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">virtualScroll</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">virtualScrollItemSize</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">36</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">virtualScrollHeight</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">240</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">virtualScroll</code> renders the flat, post-expand/collapse visible
        rows through <code class="font-mono">@dynamong/virtual-scroll</code>. Every
        <code class="font-mono">treeitem</code> is the same height (depth is indentation, not extra
        height), so it applies to any tree with no grouping caveat.
      </p>
    </docs-page-shell>
  `,
})
export class TreeSelectDocPage {
  protected readonly nodes = NODES;
  protected readonly manyNodes = MANY_NODES;
  protected readonly category = new FormControl<string | null>(null);
  protected readonly manyValue = signal<string | null>(null);
}
