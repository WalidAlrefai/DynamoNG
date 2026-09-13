import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoBadge } from '@dynamong/badge';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'severities', title: 'Severities' },
  { id: 'variant-size', title: 'Variant & Size' },
  { id: 'dot', title: 'Dot' },
];

const API: ApiTableRow[] = [
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'",
    default: "'primary'",
  },
  { name: 'variant', type: "'solid' | 'outline'", default: "'solid'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'dot', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-badge-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoBadge, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Badge"
      description="A small, severity-colored label for status or metadata."
      [examples]="examples"
    >
      <docs-example
        exampleId="severities"
        title="Severities"
        description="severity picks one of the six theme colors."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-badge severity="primary">Primary</dg-badge>
          <dg-badge severity="secondary">Secondary</dg-badge>
          <dg-badge severity="success">Success</dg-badge>
          <dg-badge severity="info">Info</dg-badge>
          <dg-badge severity="warning">Warning</dg-badge>
          <dg-badge severity="danger">Danger</dg-badge>
        </div>
        <div code>
          &lt;dg-badge severity="success"&gt;Active&lt;/dg-badge&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="variant-size"
        title="Variant & Size"
        description="variant switches between a filled and an outline style; size sets the scale."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-badge severity="primary" variant="outline">Outline</dg-badge>
          <dg-badge severity="success" size="sm">Small</dg-badge>
          <dg-badge severity="success" size="lg">Large</dg-badge>
        </div>
        <div code>
          &lt;dg-badge severity="primary"
          variant="outline"&gt;Outline&lt;/dg-badge&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="dot"
        title="Dot"
        description="dot renders a bare notification dot instead of the pill — no padding, no projected content, a fixed square per size."
      >
        <div preview class="flex flex-wrap items-center gap-3">
          <dg-badge severity="danger" [dot]="true" size="sm" />
          <dg-badge severity="danger" [dot]="true" size="md" />
          <dg-badge severity="danger" [dot]="true" size="lg" />
        </div>
        <div code>&lt;dg-badge severity="danger" [dot]="true" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class BadgeDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
