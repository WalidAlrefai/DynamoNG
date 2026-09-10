import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSwitch } from '@dynamong/switch';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';
import switchApiRows from '../generated/api/switch.json';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'disabled', title: 'Disabled' },
];

@Component({
  selector: 'docs-switch-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSwitch, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Switch"
      description="A boolean on/off toggle control."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a boolean with [(checked)]. Projected content is the label."
        [code]="basicCode"
      >
        <div preview>
          <dg-switch [(checked)]="enabled">Enable notifications</dg-switch>
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three track sizes via the size input — sm, md (default), and lg."
        [code]="sizesCode"
      >
        <div preview class="flex flex-col gap-3">
          <dg-switch size="sm">Small</dg-switch>
          <dg-switch size="md">Medium</dg-switch>
          <dg-switch size="lg">Large</dg-switch>
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the control out and blocks interaction."
        [code]="disabledCode"
      >
        <div preview>
          <dg-switch [disabled]="true">Disabled option</dg-switch>
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SwitchDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows: ApiTableRow[] = switchApiRows;
  protected readonly enabled = signal(true);

  protected readonly basicCode = `<dg-switch [(checked)]="enabled">Enable notifications</dg-switch>`;
  protected readonly sizesCode = `<dg-switch size="sm">Small</dg-switch>
<dg-switch size="md">Medium</dg-switch>
<dg-switch size="lg">Large</dg-switch>`;
  protected readonly disabledCode = `<dg-switch [disabled]="true">Disabled option</dg-switch>`;
}
