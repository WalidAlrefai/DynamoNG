import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'variants', title: 'Severity & Variant' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'states', title: 'Loading & Disabled' },
];

const API: ApiTableRow[] = [
  { name: 'severity', type: 'DynamoSeverity', default: "'primary'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'variant', type: "'solid' | 'outline' | 'text'", default: "'solid'" },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'loading', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Button"
      description="Triggers an action. Supports severity, size, variant, and a loading state."
      [examples]="examples"
    >
      <docs-example
        exampleId="variants"
        title="Severity & Variant"
        description="severity picks the color; variant picks the fill — solid, outline, or text."
      >
        <div preview class="flex flex-wrap gap-2">
          <dg-button severity="primary">Primary</dg-button>
          <dg-button severity="danger" variant="outline">Danger outline</dg-button>
          <dg-button severity="success" variant="text">Success text</dg-button>
        </div>
        <div code>
          &lt;dg-button severity="primary"&gt;Primary&lt;/dg-button&gt;
          &lt;dg-button severity="danger"
          variant="outline"&gt;Danger&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three heights via the size input."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-button size="sm">Small</dg-button>
          <dg-button size="md">Medium</dg-button>
          <dg-button size="lg">Large</dg-button>
        </div>
        <div code>
          &lt;dg-button size="sm"&gt;Small&lt;/dg-button&gt; &lt;dg-button
          size="lg"&gt;Large&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="states"
        title="Loading & Disabled"
        description="loading shows a spinner and blocks clicks; disabled greys the button out."
      >
        <div preview class="flex flex-wrap gap-2">
          <dg-button [loading]="true">Loading</dg-button>
          <dg-button [disabled]="true">Disabled</dg-button>
        </div>
        <div code>
          &lt;dg-button [loading]="true"&gt;Loading&lt;/dg-button&gt; &lt;dg-button
          [disabled]="true"&gt;Disabled&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ButtonDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
