import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoCascadeSelect } from '@dynamong/cascade-select';
import type { DynamoTreeNode } from '@dynamong/tree';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

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

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

const API: ApiTableRow[] = [
  { name: 'nodes', type: 'DynamoTreeNode[]', default: 'required' },
  { name: 'placeholder', type: 'string', default: "'Select...'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'invalid', type: 'boolean', default: 'false' },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '240' },
];

@Component({
  selector: 'docs-cascade-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoCascadeSelect,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Cascade Select"
      description="A multi-level dependent dropdown — selecting a branch reveals its children in a side flyout, down to a leaf."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a DynamoTreeNode tree; only leaf nodes (those with a value) are selectable."
      >
        <div preview class="max-w-xs">
          <dg-cascade-select
            [nodes]="nodes"
            [formControl]="location"
            ariaLabel="Location"
          />
          <p class="mt-2 text-sm text-text-muted">
            Value:
            <span class="font-mono">{{ location.value ?? '(none)' }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-cascade-select [nodes]="nodes" [formControl]="location" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="virtualScroll renders every open level's row list virtualized — no grouping caveat, since each level is a flat same-height list."
      >
        <div preview class="max-w-xs">
          <dg-cascade-select
            [nodes]="manyNodes"
            [(value)]="manyValue"
            [virtualScroll]="true"
            ariaLabel="Item (virtualized)"
            placeholder="100 categories × 100 items"
          />
        </div>
        <div code>
          &lt;dg-cascade-select [nodes]="manyNodes" [(value)]="manyValue"
          [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class CascadeSelectDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly nodes = NODES;
  protected readonly manyNodes = MANY_NODES;
  protected readonly location = new FormControl<string | null>(null);
  protected readonly manyValue = signal<string | null>(null);
}
