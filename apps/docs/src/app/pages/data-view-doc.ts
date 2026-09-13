import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import {
  DynamoDataView,
  type DynamoDataViewLazyLoadEvent,
} from '@dynamong/data-view';
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

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'paginator-position', title: 'Paginator Position' },
  { id: 'track-by', title: 'Track By' },
  { id: 'lazy', title: 'Lazy (Server-Side) Mode' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'readonly T[] (required)', default: '—' },
  { name: 'layout', type: "'list' | 'grid' (model)", default: "'list'" },
  { name: 'rows', type: 'number (model)', default: '10' },
  { name: 'page', type: 'number (model)', default: '1' },
  { name: 'paginator', type: 'boolean', default: 'true' },
  {
    name: 'paginatorPosition',
    type: "'top' | 'bottom' | 'both'",
    default: "'bottom'",
  },
  { name: 'rowsPerPageOptions', type: 'number[]', default: '[10, 25, 50]' },
  { name: 'sortField', type: 'keyof T | null (model)', default: 'null' },
  { name: 'sortOrder', type: '1 | -1 (model)', default: '1' },
  { name: 'dataKey', type: 'keyof T | undefined', default: 'undefined' },
  {
    name: 'trackBy',
    type: '((item: T, index: number) => unknown) | undefined',
    default: 'undefined',
  },
  { name: 'emptyMessage', type: 'string', default: "'No records found'" },
  { name: 'lazy', type: 'boolean', default: 'false' },
  { name: 'totalRecords', type: 'number | undefined', default: 'undefined' },
  {
    name: 'lazyLoad (output)',
    type: 'DynamoDataViewLazyLoadEvent<T>',
    default: '—',
  },
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

      <docs-example
        exampleId="paginator-position"
        title="Paginator Position"
        description="paginatorPosition places the paginator above, below, or on both sides of the content."
      >
        <div preview>
          <dg-data-view [value]="products" [rows]="4" paginatorPosition="both">
            <ng-template let-product>
              <div class="flex items-center justify-between p-3">
                <p class="font-medium text-text-primary">{{ product.name }}</p>
                <span class="font-mono text-sm">\${{ product.price }}</span>
              </div>
            </ng-template>
          </dg-data-view>
        </div>
        <div code>
          &lt;dg-data-view [value]="products" [rows]="4"
          paginatorPosition="both"&gt; ... &lt;/dg-data-view&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="track-by"
        title="Track By"
        description="trackBy takes a full (item, index) => unknown function, mirroring DynamoTable's own trackBy — it takes priority over dataKey when both are set."
      >
        <div preview>
          <dg-data-view [value]="products" [rows]="4" [trackBy]="trackByFn">
            <ng-template let-product>
              <div class="flex items-center justify-between p-3">
                <p class="font-medium text-text-primary">{{ product.name }}</p>
                <span class="font-mono text-sm">\${{ product.price }}</span>
              </div>
            </ng-template>
          </dg-data-view>
        </div>
        <div code>
          protected trackByFn = (product: Product) =&gt; product.id;
          &lt;dg-data-view [value]="products" [trackBy]="trackByFn"&gt; ...
          &lt;/dg-data-view&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="lazy"
        title="Lazy (Server-Side) Mode"
        description="In lazy mode, value holds only the current page. DynamoDataView no longer sorts or slices it — it emits lazyLoad on every page/sort change and the consumer re-fetches and re-binds value + totalRecords."
      >
        <div preview class="space-y-2">
          <dg-data-view
            [value]="lazyPage()"
            [rows]="4"
            [lazy]="true"
            [totalRecords]="products.length"
            (lazyLoad)="onLazyLoad($event)"
          >
            <ng-template let-product>
              <div class="flex items-center justify-between p-3">
                <p class="font-medium text-text-primary">{{ product.name }}</p>
                <span class="font-mono text-sm">\${{ product.price }}</span>
              </div>
            </ng-template>
          </dg-data-view>
          <p class="text-sm text-text-muted">
            lazyLoad fired
            <span class="font-mono">{{ lazyLoadCount() }}</span> time(s)
          </p>
        </div>
        <div code>
          &lt;dg-data-view [value]="page()" [lazy]="true" [totalRecords]="total"
          (lazyLoad)="fetchPage($event)"&gt; ... &lt;/dg-data-view&gt;
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
  protected readonly trackByFn = (product: Product) => product.id;

  protected readonly lazyLoadCount = signal(0);
  protected readonly lazyPage = signal(PRODUCTS.slice(0, 4));

  protected onLazyLoad(event: DynamoDataViewLazyLoadEvent<Product>): void {
    this.lazyLoadCount.set(this.lazyLoadCount() + 1);
    this.lazyPage.set(PRODUCTS.slice(event.first, event.first + event.rows));
  }
}
