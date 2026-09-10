import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDataView } from '@dynamong/data-view';
import { DocPageShell } from '../components/doc-page-shell';

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

@Component({
  selector: 'docs-data-view-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoDataView, DynamoButton, DocPageShell],
  template: `
    <docs-page-shell
      name="DataView"
      description="Renders a data set as a paged list or card grid from a single item template, with a built-in paginator and optional client-side sort."
    >
      <div demo class="space-y-3">
        <div class="flex gap-2">
          <dg-button
            size="sm"
            [variant]="layout() === 'list' ? 'solid' : 'outline'"
            (click)="layout.set('list')"
            >List</dg-button
          >
          <dg-button
            size="sm"
            [variant]="layout() === 'grid' ? 'solid' : 'outline'"
            (click)="layout.set('grid')"
            >Grid</dg-button
          >
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
                <p class="font-medium text-text-primary">{{ product.name }}</p>
                <p class="text-sm text-text-muted">{{ product.category }}</p>
              </div>
              <span class="font-mono text-sm"
                >\${{ product.price }}</span
              >
            </div>
          </ng-template>
        </dg-data-view>
      </div>
      <div code>
        &lt;dg-data-view [value]="products" [(layout)]="layout" [rows]="6"&gt;
        &lt;ng-template let-product&gt; ... &lt;/ng-template&gt;
        &lt;/dg-data-view&gt;
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
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">readonly T[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">layout</td>
            <td class="py-2 pr-4 font-mono">'list' | 'grid' (model)</td>
            <td class="py-2 font-mono">'list'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">rows</td>
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">10</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">page</td>
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">paginator</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">rowsPerPageOptions</td>
            <td class="py-2 pr-4 font-mono">number[]</td>
            <td class="py-2 font-mono">[10, 25, 50]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">sortField</td>
            <td class="py-2 pr-4 font-mono">keyof T | null (model)</td>
            <td class="py-2 font-mono">null</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">sortOrder</td>
            <td class="py-2 pr-4 font-mono">1 | -1 (model)</td>
            <td class="py-2 font-mono">1</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">emptyMessage</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'No records found'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class DataViewDocPage {
  protected readonly products = PRODUCTS;
  protected readonly layout = signal<'list' | 'grid'>('list');
}
