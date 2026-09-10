import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoTag } from '@dynamong/tag';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'severities', title: 'Severities' },
  { id: 'variant-size', title: 'Variant & Size' },
];

const API: ApiTableRow[] = [
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'",
    default: "'primary'",
  },
  { name: 'variant', type: "'solid' | 'outline'", default: "'solid'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
];

@Component({
  selector: 'docs-tag-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTag, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Tag"
      description="A static, non-removable severity-colored label."
      [examples]="examples"
    >
      <docs-example
        exampleId="severities"
        title="Severities"
        description="severity picks one of the six theme colors."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-tag severity="primary">Primary</dg-tag>
          <dg-tag severity="secondary">Secondary</dg-tag>
          <dg-tag severity="success">Success</dg-tag>
          <dg-tag severity="info">Info</dg-tag>
          <dg-tag severity="warning">Warning</dg-tag>
          <dg-tag severity="danger">Danger</dg-tag>
        </div>
        <div code>&lt;dg-tag severity="info"&gt;TypeScript&lt;/dg-tag&gt;</div>
      </docs-example>

      <docs-example
        exampleId="variant-size"
        title="Variant & Size"
        description="variant switches between filled and outline; size sets the scale."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-tag severity="primary" variant="outline">Outline</dg-tag>
          <dg-tag severity="success" size="sm">Small</dg-tag>
          <dg-tag severity="success" size="lg">Large</dg-tag>
        </div>
        <div code>&lt;dg-tag severity="primary" variant="outline"&gt;Outline&lt;/dg-tag&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class TagDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
