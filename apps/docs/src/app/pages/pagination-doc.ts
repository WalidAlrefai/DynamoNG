import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoPagination } from '@dynamong/pagination';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-pagination-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPagination, DocPageShell],
  template: `
    <docs-page-shell
      name="Pagination"
      description="A pagination control with windowed page-number navigation, ellipsis truncation for large page counts, and a rows-per-page selector — built from DynamoButton and DynamoSelect."
    >
      <div demo>
        <dg-pagination
          [totalItems]="totalItems"
          [(page)]="page"
          [(pageSize)]="pageSize"
        />
      </div>
      <div code>
        &lt;dg-pagination [totalItems]="250" [(page)]="page"
        [(pageSize)]="pageSize" /&gt;
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
            <td class="py-2 pr-4 font-mono">totalItems</td>
            <td class="py-2 pr-4 font-mono">number (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">page</td>
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">pageSize</td>
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">10</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">pageSizeOptions</td>
            <td class="py-2 pr-4 font-mono">number[]</td>
            <td class="py-2 font-mono">[10, 25, 50, 100]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showPageSizeSelector</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">maxVisiblePages</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">5</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Pagination'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class PaginationDocPage {
  protected readonly totalItems = 250;
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
}
