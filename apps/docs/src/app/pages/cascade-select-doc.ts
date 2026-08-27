import { ChangeDetectionStrategy, Component } from '@angular/core';
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
export class CascadeSelectDocPage {
  protected readonly nodes = NODES;
  protected readonly location = new FormControl<string | null>(null);
}
