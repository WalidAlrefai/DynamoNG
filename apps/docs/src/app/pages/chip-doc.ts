import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoChip } from '@dynamong/chip';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'removable', title: 'Removable' },
];

const API: ApiTableRow[] = [
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'",
    default: "'primary'",
  },
  { name: 'variant', type: "'solid' | 'outline'", default: "'solid'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'removable', type: 'boolean', default: 'false' },
  { name: 'removeAriaLabel', type: 'string', default: "'Remove'" },
];

@Component({
  selector: 'docs-chip-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoChip, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Chip"
      description="A compact, optionally-removable label."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="severity picks the color; variant switches between filled and outline."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-chip severity="primary">Primary</dg-chip>
          <dg-chip severity="success" variant="outline">Outline</dg-chip>
        </div>
        <div code>&lt;dg-chip severity="primary"&gt;Frontend&lt;/dg-chip&gt;</div>
      </docs-example>

      <docs-example
        exampleId="removable"
        title="Removable"
        description="removable adds an × button; (removed) fires when it's clicked."
      >
        <div preview>
          <dg-chip severity="secondary" [removable]="true">Removable</dg-chip>
        </div>
        <div code>
          &lt;dg-chip severity="secondary" [removable]="true"
          (removed)="onRemove()"&gt;Frontend&lt;/dg-chip&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ChipDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
