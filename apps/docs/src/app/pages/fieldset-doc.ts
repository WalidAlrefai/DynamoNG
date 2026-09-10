import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoFieldset } from '@dynamong/fieldset';
import { DynamoInputText } from '@dynamong/input-text';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'collapsible', title: 'Collapsible' },
  { id: 'disabled', title: 'Disabled' },
];

const API: ApiTableRow[] = [
  { name: 'legend', type: 'string', default: "''" },
  { name: 'collapsible', type: 'boolean', default: 'false' },
  { name: 'collapsed', type: 'boolean (model)', default: 'false' },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false — maps to native <fieldset disabled>',
  },
];

@Component({
  selector: 'docs-fieldset-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoFieldset,
    DynamoInputText,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Fieldset"
      description="A bordered, legend'd form section built on the real native <fieldset>/<legend> elements."
      [examples]="examples"
    >
      <docs-example
        exampleId="collapsible"
        title="Collapsible"
        description="collapsible adds a toggle to the legend; two-way bind [(collapsed)] to control it."
      >
        <div preview class="max-w-md">
          <dg-fieldset legend="Contact info" [collapsible]="true">
            <div class="flex flex-col gap-2">
              <dg-input-text placeholder="Name" ariaLabel="Name" />
              <dg-input-text placeholder="Email" ariaLabel="Email" />
            </div>
          </dg-fieldset>
        </div>
        <div code>
          &lt;dg-fieldset legend="Contact info" [collapsible]="true"&gt;
          &lt;dg-input-text ariaLabel="Name" /&gt; &lt;/dg-fieldset&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled maps to the native <fieldset disabled> attribute, disabling every descendant control for free."
      >
        <div preview class="max-w-md">
          <dg-fieldset legend="Disabled section" [disabled]="true">
            <dg-input-text
              placeholder="This field is disabled for free"
              ariaLabel="Disabled field"
            />
          </dg-fieldset>
        </div>
        <div code>
          &lt;dg-fieldset legend="Section" [disabled]="true"&gt; ...
          &lt;/dg-fieldset&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class FieldsetDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
