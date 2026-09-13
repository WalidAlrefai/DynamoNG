import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoTreeSelect } from '@dynamong/tree-select';
import type { DynamoTreeNode } from '@dynamong/tree';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

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

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'filterable', title: 'Filterable' },
  { id: 'readonly', title: 'Read-only' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

const API: ApiTableRow[] = [
  { name: 'nodes', type: 'DynamoTreeNode[]', default: 'required' },
  { name: 'placeholder', type: 'string', default: "'Select...'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'readOnly', type: 'boolean', default: 'false' },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterText', type: 'string (model)', default: "''" },
  { name: 'filterPlaceholder', type: 'string', default: "'Search...'" },
  {
    name: 'noResultsMessage',
    type: 'string',
    default: "'No matching options'",
  },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '240' },
];

@Component({
  selector: 'docs-tree-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoTreeSelect,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Tree Select"
      description="A dropdown combobox whose panel shows a hierarchical, expandable tree."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a DynamoTreeNode tree; expanding a branch reveals its children, and leaf nodes are selectable."
      >
        <div preview class="max-w-xs">
          <dg-tree-select
            [nodes]="nodes"
            [formControl]="category"
            ariaLabel="Category"
          />
          <p class="mt-2 text-sm text-text-muted">
            Value:
            <span class="font-mono">{{ category.value ?? '(none)' }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-tree-select [nodes]="nodes" [formControl]="category" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="filterable"
        title="Filterable"
        description="filterable renders a search box above the tree. Branches with no matching label anywhere in their subtree are hidden; a branch containing a match auto-reveals that descendant."
      >
        <div preview class="max-w-xs">
          <dg-tree-select
            [nodes]="nodes"
            [(value)]="filterValue"
            [filterable]="true"
            ariaLabel="Category (filterable)"
          />
        </div>
        <div code>
          &lt;dg-tree-select [nodes]="nodes" [(value)]="value"
          [filterable]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="readonly"
        title="Read-only"
        description="readOnly keeps the trigger focusable and lets the panel open for browsing, but blocks committing a node — unlike disabled, it isn't dimmed or removed from the tab order."
      >
        <div preview class="max-w-xs">
          <dg-tree-select
            [nodes]="nodes"
            [(value)]="readonlyValue"
            [readOnly]="true"
            ariaLabel="Category (read-only)"
          />
        </div>
        <div code>
          &lt;dg-tree-select [nodes]="nodes" [(value)]="value" [readOnly]="true"
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="virtualScroll renders the flat post-expand visible rows virtualized — applies to any tree with no grouping caveat."
      >
        <div preview class="max-w-xs">
          <dg-tree-select
            [nodes]="manyNodes"
            [(value)]="manyValue"
            [virtualScroll]="true"
            ariaLabel="Item (virtualized)"
            placeholder="Expand to browse 5,000 items"
          />
        </div>
        <div code>
          &lt;dg-tree-select [nodes]="manyNodes" [(value)]="manyValue"
          [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class TreeSelectDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly nodes = NODES;
  protected readonly manyNodes = MANY_NODES;
  protected readonly category = new FormControl<string | null>(null);
  protected readonly manyValue = signal<string | null>(null);
  protected readonly filterValue = signal<string | null>(null);
  protected readonly readonlyValue = signal<string | null>('grain');
}
