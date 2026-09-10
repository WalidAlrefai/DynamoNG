import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoMegaMenu } from '@dynamong/mega-menu';
import type { DynamoMegaMenuItem } from '@dynamong/mega-menu';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const ITEMS: DynamoMegaMenuItem[] = [
  {
    label: 'Products',
    columns: [
      {
        header: 'Laptops',
        items: [
          { label: 'MacBook Air' },
          { label: 'MacBook Pro' },
          { label: 'Compare models' },
        ],
      },
      {
        header: 'Desktops',
        items: [
          { label: 'iMac' },
          { label: 'Mac mini' },
          { label: 'Mac Studio' },
        ],
      },
      {
        header: 'Accessories',
        items: [
          { label: 'Keyboard' },
          { label: 'Mouse' },
          { label: 'Trackpad' },
        ],
      },
    ],
  },
  {
    label: 'Solutions',
    columns: [
      {
        header: 'By team',
        items: [
          { label: 'Engineering' },
          { label: 'Design' },
          { label: 'Sales' },
        ],
      },
      {
        header: 'By size',
        items: [
          { label: 'Startup' },
          { label: 'Mid-market' },
          { label: 'Enterprise' },
        ],
      },
    ],
  },
  { label: 'Pricing' },
  { label: 'Contact' },
];

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoMegaMenuItem[] (required)', default: '—' },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
  },
  { name: 'openIndex', type: 'number | null (model)', default: 'null' },
  { name: 'linkSelect', type: 'output<DynamoMegaMenuLink>', default: '—' },
];

@Component({
  selector: 'docs-mega-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMegaMenu, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="MegaMenu"
      description="A horizontal (or vertical) bar whose items open a single multi-column panel of links, with full keyboard navigation."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Each item may carry columns of { header, items }; an item with no columns is a leaf that fires its command directly."
      >
        <div preview>
          <dg-mega-menu [items]="items" ariaLabel="Main" />
        </div>
        <div code>&lt;dg-mega-menu [items]="items" ariaLabel="Main" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class MegaMenuDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly items = ITEMS;
}
