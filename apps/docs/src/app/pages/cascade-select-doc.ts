import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoCascadeSelect } from '@dynamong/cascade-select';
import type { DynamoTreeNode } from '@dynamong/tree';
import { DocPageShell } from '../components/doc-page-shell';

const NODES: DynamoTreeNode<string>[] = [
  {
    id: 'usa',
    label: 'United States',
    children: [
      {
        id: 'california',
        label: 'California',
        children: [
          { id: 'la', label: 'Los Angeles', value: 'la' },
          { id: 'sf', label: 'San Francisco', value: 'sf' },
        ],
      },
      {
        id: 'texas',
        label: 'Texas',
        children: [
          { id: 'austin', label: 'Austin', value: 'austin' },
          { id: 'dallas', label: 'Dallas', value: 'dallas', disabled: true },
        ],
      },
    ],
  },
  {
    id: 'canada',
    label: 'Canada',
    children: [
      {
        id: 'ontario',
        label: 'Ontario',
        disabled: true,
        children: [{ id: 'toronto', label: 'Toronto', value: 'toronto' }],
      },
    ],
  },
  { id: 'mexico', label: 'Mexico', value: 'mexico' },
];

// 100 categories × 100 items — every open level's row list renders
// through `@dynamong/virtual-scroll`.
const MANY_NODES: DynamoTreeNode<string>[] = Array.from(
  { length: 100 },
  (_, c) => ({
    id: `cat-${c + 1}`,
    label: `Category ${c + 1}`,
    children: Array.from({ length: 100 }, (_, i) => ({
      id: `cat-${c + 1}-item-${i + 1}`,
      label: `Item ${c + 1}.${i + 1}`,
      value: `cat-${c + 1}-item-${i + 1}`,
    })),
  }),
);

@Component({
  selector: 'docs-cascade-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCascadeSelect, ReactiveFormsModule, DocPageShell],
  template: `
    <docs-page-shell
      name="Cascade Select"
      description="A multi-level dependent dropdown — selecting a branch reveals its children in a side flyout, down to a leaf."
    >
      <div demo class="max-w-xs">
        <dg-cascade-select
          [nodes]="nodes"
          [formControl]="location"
          ariaLabel="Location"
        />
        <p class="mt-2 text-sm text-text-muted">
          Value: <span class="font-mono">{{ location.value ?? '(none)' }}</span>
        </p>
      </div>
      <div code>&lt;dg-cascade-select [nodes]="nodes" [formControl]="location" /&gt;</div>
      <div demo class="max-w-xs">
        <dg-cascade-select
          [nodes]="manyNodes"
          [(value)]="manyValue"
          [virtualScroll]="true"
          ariaLabel="Item (virtualized)"
          placeholder="100 categories × 100 items"
        />
        <p class="mt-2 text-sm text-text-muted">
          Every level — root and each flyout — renders its rows through
          <code class="font-mono">@dynamong/virtual-scroll</code>.
        </p>
      </div>
      <div code>
        &lt;dg-cascade-select [nodes]="manyNodes" [(value)]="manyValue"
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
            <td class="py-2 pr-4 font-mono">invalid</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
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
        <code class="font-mono">virtualScroll</code> renders every open level's row list through
        <code class="font-mono">@dynamong/virtual-scroll</code>. Each level's nodes are a flat,
        same-height list, so it applies with no grouping caveat.
      </p>
    </docs-page-shell>
  `,
})
export class CascadeSelectDocPage {
  protected readonly nodes = NODES;
  protected readonly manyNodes = MANY_NODES;
  protected readonly location = new FormControl<string | null>(null);
  protected readonly manyValue = signal<string | null>(null);
}
