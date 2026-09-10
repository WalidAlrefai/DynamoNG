import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoRadio } from '@dynamong/radio';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';
import radioApiRows from '../generated/api/radio.json';

const EXAMPLES: DocExampleRef[] = [
  { id: 'group', title: 'Radio Group' },
  { id: 'disabled', title: 'Disabled' },
];

@Component({
  selector: 'docs-radio-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoRadio, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Radio"
      description="A single-selection control among a group of native radio inputs sharing a name."
      [examples]="examples"
    >
      <docs-example
        exampleId="group"
        title="Radio Group"
        description="There is no group wrapper — give siblings the same name and drive them from one selection signal via the split [checked]/(checkedChange) binding."
        [code]="groupCode"
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio
            name="plan"
            value="free"
            [checked]="plan() === 'free'"
            (checkedChange)="plan.set('free')"
          >
            Free
          </dg-radio>
          <dg-radio
            name="plan"
            value="pro"
            [checked]="plan() === 'pro'"
            (checkedChange)="plan.set('pro')"
          >
            Pro
          </dg-radio>
          <dg-radio
            name="plan"
            value="enterprise"
            [checked]="plan() === 'enterprise'"
            (checkedChange)="plan.set('enterprise')"
          >
            Enterprise
          </dg-radio>
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="A single option can be disabled without affecting its siblings."
        [code]="disabledCode"
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio name="plan2" value="a" [checked]="true">Available</dg-radio>
          <dg-radio [disabled]="true" name="plan2" value="b">
            Enterprise (disabled)
          </dg-radio>
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          There is no <code>RadioGroup</code> container — give sibling radios the
          same <code>name</code> for native grouping, and drive them from one
          shared selection signal using the split-binding form shown above (not
          full <code>[(checked)]</code>, which would desync a deselected sibling
          since native radios never fire <code>change</code> on deselection).
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class RadioDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows: ApiTableRow[] = radioApiRows;
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');

  protected readonly groupCode = `plan = signal<'free' | 'pro' | 'enterprise'>('free');

<dg-radio name="plan" value="free"
  [checked]="plan() === 'free'"
  (checkedChange)="plan.set('free')">Free</dg-radio>
<dg-radio name="plan" value="pro"
  [checked]="plan() === 'pro'"
  (checkedChange)="plan.set('pro')">Pro</dg-radio>`;
  protected readonly disabledCode = `<dg-radio [disabled]="true" name="plan" value="enterprise">
  Enterprise (disabled)
</dg-radio>`;
}
