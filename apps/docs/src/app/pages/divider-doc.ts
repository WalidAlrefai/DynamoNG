import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoDivider } from '@dynamong/divider';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'horizontal', title: 'Horizontal' },
  { id: 'vertical', title: 'Vertical' },
];

const API: ApiTableRow[] = [
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
  },
];

@Component({
  selector: 'docs-divider-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoDivider, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Divider"
      description="A horizontal or vertical rule, optionally with a centered label."
      [examples]="examples"
    >
      <docs-example
        exampleId="horizontal"
        title="Horizontal"
        description="The default. Projected content becomes a centered label breaking the rule."
      >
        <div preview class="flex flex-col gap-4">
          <dg-divider />
          <dg-divider>OR</dg-divider>
        </div>
        <div code>&lt;dg-divider&gt;OR&lt;/dg-divider&gt;</div>
      </docs-example>

      <docs-example
        exampleId="vertical"
        title="Vertical"
        description="orientation=&quot;vertical&quot; draws a full-height rule between inline items."
      >
        <div preview class="flex h-8 items-center gap-3">
          <span class="text-text-primary">Left</span>
          <dg-divider orientation="vertical" />
          <span class="text-text-primary">Right</span>
        </div>
        <div code>&lt;dg-divider orientation="vertical" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DividerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
