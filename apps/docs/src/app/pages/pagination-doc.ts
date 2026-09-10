import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoPagination } from '@dynamong/pagination';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'totalItems', type: 'number (required)', default: '—' },
  { name: 'page', type: 'number (model)', default: '1' },
  { name: 'pageSize', type: 'number (model)', default: '10' },
  { name: 'pageSizeOptions', type: 'number[]', default: '[10, 25, 50, 100]' },
  { name: 'showPageSizeSelector', type: 'boolean', default: 'true' },
  { name: 'maxVisiblePages', type: 'number', default: '5' },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'ariaLabel', type: 'string', default: "'Pagination'" },
];

@Component({
  selector: 'docs-pagination-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPagination, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Pagination"
      description="A pagination control with windowed page-number navigation, ellipsis truncation for large page counts, and a rows-per-page selector — built from DynamoButton and DynamoSelect."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass totalItems and two-way bind [(page)] and [(pageSize)]; the control derives the page count and windows the number buttons."
      >
        <div preview>
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
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class PaginationDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly totalItems = 250;
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
}
