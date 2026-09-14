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
  { id: 'type', title: 'Line Style' },
  { id: 'align', title: 'Align' },
];

const API: ApiTableRow[] = [
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
  },
  {
    name: 'type',
    type: "'solid' | 'dashed' | 'dotted'",
    default: "'solid'",
  },
  {
    name: 'align',
    type: "'left' | 'center' | 'right' | 'top' | 'bottom'",
    default: "'center'",
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
      description="A horizontal or vertical rule, optionally with a label, in solid/dashed/dotted styles."
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
        description='orientation="vertical" draws a full-height rule between inline items.'
      >
        <div preview class="flex h-8 items-center gap-3">
          <span class="text-text-primary">Left</span>
          <dg-divider orientation="vertical" />
          <span class="text-text-primary">Right</span>
        </div>
        <div code>&lt;dg-divider orientation="vertical" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="type"
        title="Line Style"
        description="type switches the rule's border style between solid, dashed, and dotted."
      >
        <div preview class="flex flex-col gap-4">
          <dg-divider type="solid">Solid</dg-divider>
          <dg-divider type="dashed">Dashed</dg-divider>
          <dg-divider type="dotted">Dotted</dg-divider>
        </div>
        <div code>
          &lt;dg-divider type="dashed"&gt;Dashed&lt;/dg-divider&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="align"
        title="Align"
        description="align shifts the label toward one end by shrinking the line segment on that side — left/right for horizontal, top/bottom for vertical."
      >
        <div preview class="flex flex-col gap-4">
          <dg-divider align="left">Left</dg-divider>
          <dg-divider align="right">Right</dg-divider>
          <div class="flex h-24 items-stretch gap-3">
            <dg-divider orientation="vertical" align="top">Top</dg-divider>
          </div>
        </div>
        <div code>&lt;dg-divider align="left"&gt;Left&lt;/dg-divider&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DividerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
