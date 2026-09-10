import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDataView } from '@dynamong/data-view';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

const PRODUCTS: Product[] = Array.from({ length: 42 }, (_, i) => ({
  id: i + 1,
  name: `Product ${String(i + 1).padStart(2, '0')}`,
  category: ['Audio', 'Wearables', 'Home', 'Mobile'][i % 4] as string,
  price: 19 + ((i * 7) % 180),
}));

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'value', type: 'readonly T[] (required)', default: '—' },
  { name: 'layout', type: "'list' | 'grid' (model)", default: "'list'" },
  { name: 'rows', type: 'number (model)', default: '10' },
  { name: 'page', type: 'number (model)', default: '1' },
  { name: 'paginator', type: 'boolean', default: 'true' },
  { name: 'rowsPerPageOptions', type: 'number[]', default: '[10, 25, 50]' },
  { name: 'sortField', type: 'keyof T | null (model)', default: 'null' },
  { name: 'sortOrder', type: '1 | -1 (model)', default: '1' },
  { name: 'emptyMessage', type: 'string', default: "'No records found'" },
];

@Component({
  selector: 'docs-data-view-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoDataView,
    DynamoButton,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="DataView"
      description="Renders a data set as a paged list or card grid from a single item template, with a built-in paginator and optional client-side sort."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="One projected <ng-template let-item> renders each record; [(layout)] toggles list vs. grid, and the paginator + sort are built in."
      >
        <div preview class="space-y-3">
          <div class="flex gap-2">
            <dg-button
              size="sm"
              [variant]="layout() === 'list' ? 'solid' : 'outline'"
              (click)="layout.set('list')"
            >
              List
            </dg-button>
            <dg-button
              size="sm"
              [variant]="layout() === 'grid' ? 'solid' : 'outline'"
              (click)="layout.set('grid')"
            >
              Grid
            </dg-button>
          </div>
          <dg-data-view
            [value]="products"
            [(layout)]="layout"
            [rows]="6"
            dataKey="id"
            sortField="price"
          >
            <ng-template let-product>
              <div class="flex items-center justify-between p-3">
                <div>
                  <p class="font-medium text-text-primary">
                    {{ product.name }}
                  </p>
                  <p class="text-sm text-text-muted">{{ product.category }}</p>
                </div>
                <span class="font-mono text-sm">\${{ product.price }}</span>
              </div>
            </ng-template>
          </dg-data-view>
        </div>
        <div code>
          &lt;dg-data-view [value]="products" [(layout)]="layout" [rows]="6"&gt;
          &lt;ng-template let-product&gt; ... &lt;/ng-template&gt;
          &lt;/dg-data-view&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DataViewDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly products = PRODUCTS;
  protected readonly layout = signal<'list' | 'grid'>('list');
}
