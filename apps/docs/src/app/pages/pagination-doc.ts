import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoPagination } from '@dynamong/pagination';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'first-last', title: 'First / Last Buttons' },
  { id: 'jump', title: 'Jump to Page' },
  { id: 'report', title: 'Custom Report' },
];

const API: ApiTableRow[] = [
  { name: 'totalItems', type: 'number (required)', default: '—' },
  { name: 'page', type: 'number (model)', default: '1' },
  { name: 'pageSize', type: 'number (model)', default: '10' },
  { name: 'pageSizeOptions', type: 'number[]', default: '[10, 25, 50, 100]' },
  { name: 'showPageSizeSelector', type: 'boolean', default: 'true' },
  { name: 'showFirstLastButtons', type: 'boolean', default: 'false' },
  { name: 'hideOnSinglePage', type: 'boolean', default: 'false' },
  { name: 'maxVisiblePages', type: 'number', default: '5' },
  { name: 'showPageReport', type: 'boolean', default: 'true' },
  {
    name: 'reportTemplate',
    type: 'string',
    default: "'Showing {first}-{last} of {total}'",
  },
  { name: 'showJumpToPage', type: 'boolean', default: 'false' },
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

      <docs-example
        exampleId="first-last"
        title="First / Last Buttons"
        description="showFirstLastButtons adds jump-to-edge buttons flanking previous/next."
      >
        <div preview>
          <dg-pagination
            [totalItems]="totalItems"
            [(page)]="firstLastPage"
            [pageSize]="10"
            [showFirstLastButtons]="true"
          />
        </div>
        <div code>
          &lt;dg-pagination [totalItems]="250" [(page)]="page"
          [showFirstLastButtons]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="jump"
        title="Jump to Page"
        description="showJumpToPage adds a Go-to box; type a page and press Enter or blur — out-of-range values clamp."
      >
        <div preview>
          <dg-pagination
            [totalItems]="totalItems"
            [(page)]="jumpPage"
            [pageSize]="10"
            [showJumpToPage]="true"
          />
        </div>
        <div code>
          &lt;dg-pagination [totalItems]="250" [(page)]="page"
          [showJumpToPage]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="report"
        title="Custom Report"
        description="reportTemplate accepts {first}, {last}, {total}, {page} and {pageCount}; showPageReport hides it."
      >
        <div preview>
          <dg-pagination
            [totalItems]="totalItems"
            [(page)]="reportPage"
            [pageSize]="10"
            reportTemplate="Page {page} of {pageCount} ({total} records)"
          />
        </div>
        <div code>
          &lt;dg-pagination [totalItems]="250" [(page)]="page"
          reportTemplate="Page &#123;page&#125; of &#123;pageCount&#125;" /&gt;
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
  protected readonly firstLastPage = signal(3);
  protected readonly jumpPage = signal(1);
  protected readonly reportPage = signal(1);
}
