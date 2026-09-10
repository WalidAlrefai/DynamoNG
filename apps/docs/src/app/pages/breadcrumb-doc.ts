import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoBreadcrumb } from '@dynamong/breadcrumb';
import type { DynamoBreadcrumbItem } from '@dynamong/breadcrumb';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  {
    name: 'items',
    type: '{ label: string; href?: string }[]',
    default: 'required',
  },
  { name: 'ariaLabel', type: 'string | undefined', default: "'Breadcrumb'" },
];

@Component({
  selector: 'docs-breadcrumb-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoBreadcrumb, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Breadcrumb"
      description="A path navigation trail with a current-page indicator."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass an items array of { label, href? }; the last item renders as the current page, items without href as plain text."
      >
        <div preview>
          <dg-breadcrumb [items]="items" />
        </div>
        <div code>&lt;dg-breadcrumb [items]="breadcrumbItems" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class BreadcrumbDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly items: DynamoBreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Archived' },
    { label: 'Products', href: '/products' },
    { label: 'Keyboard' },
  ];
}
