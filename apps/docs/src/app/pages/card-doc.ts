import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoCard } from '@dynamong/card';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'variants', title: 'Variants' },
  { id: 'footer', title: 'With Footer' },
];

const API: ApiTableRow[] = [
  { name: 'header', type: 'string', default: "''" },
  { name: 'subheader', type: 'string', default: "''" },
  {
    name: 'variant',
    type: "'elevated' | 'outlined' | 'filled'",
    default: "'elevated'",
  },
];

@Component({
  selector: 'docs-card-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoCard, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Card"
      description="A content container with an optional header, body, and footer."
      [examples]="examples"
    >
      <docs-example
        exampleId="variants"
        title="Variants"
        description="variant controls the surface treatment — a shadow, a border, or a filled background."
      >
        <div preview class="flex flex-wrap gap-4">
          <div class="w-64">
            <dg-card header="Elevated" subheader="Default shadow">
              <p class="text-text-primary">Card body content.</p>
            </dg-card>
          </div>
          <div class="w-64">
            <dg-card header="Outlined" variant="outlined">
              <p class="text-text-primary">Card body content.</p>
            </dg-card>
          </div>
          <div class="w-64">
            <dg-card header="Filled" variant="filled">
              <p class="text-text-primary">Card body content.</p>
            </dg-card>
          </div>
        </div>
        <div code>
          &lt;dg-card header="Title" subheader="Subtitle" variant="outlined"&gt;
          Body &lt;/dg-card&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="footer"
        title="With Footer"
        description="Project a [footer] slot for actions below the body."
      >
        <div preview class="w-64">
          <dg-card header="Outlined" subheader="With actions" variant="outlined">
            <p class="text-text-primary">Card body content.</p>
            <div footer>
              <dg-button size="sm">Action</dg-button>
            </div>
          </dg-card>
        </div>
        <div code>
          &lt;dg-card header="Title"&gt; Body &lt;div footer&gt;&lt;dg-button
          size="sm"&gt;Action&lt;/dg-button&gt;&lt;/div&gt; &lt;/dg-card&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class CardDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
