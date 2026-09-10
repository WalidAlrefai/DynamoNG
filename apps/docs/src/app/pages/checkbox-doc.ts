import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';
import checkboxApiRows from '../generated/api/checkbox.json';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'indeterminate', title: 'Indeterminate' },
  { id: 'disabled', title: 'Disabled' },
];

@Component({
  selector: 'docs-checkbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCheckbox, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Checkbox"
      description="A tri-state (checked / unchecked / indeterminate) toggle control."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a boolean with [(checked)]. Projected content is the label."
        [code]="basicCode"
      >
        <div preview>
          <dg-checkbox [(checked)]="accepted">
            Accept terms and conditions
          </dg-checkbox>
        </div>
      </docs-example>

      <docs-example
        exampleId="indeterminate"
        title="Indeterminate"
        description="Set indeterminate for a “partially selected” parent checkbox — independent of checked."
        [code]="indeterminateCode"
      >
        <div preview>
          <dg-checkbox [indeterminate]="true">
            Select all (partially selected)
          </dg-checkbox>
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the control out and blocks interaction."
        [code]="disabledCode"
      >
        <div preview>
          <dg-checkbox [disabled]="true">Disabled option</dg-checkbox>
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class CheckboxDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows: ApiTableRow[] = checkboxApiRows;

  protected readonly accepted = signal(true);

  protected readonly basicCode = `<dg-checkbox [(checked)]="accepted">
  Accept terms and conditions
</dg-checkbox>`;
  protected readonly indeterminateCode = `<dg-checkbox [indeterminate]="true">
  Select all (partially selected)
</dg-checkbox>`;
  protected readonly disabledCode = `<dg-checkbox [disabled]="true">Disabled option</dg-checkbox>`;
}
