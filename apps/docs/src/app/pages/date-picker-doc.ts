import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoDatePicker } from '@dynamong/date-picker';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'min-max', title: 'Min / Max' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'Date | null (model)', default: 'null' },
  { name: 'min', type: 'Date | undefined', default: 'undefined' },
  { name: 'max', type: 'Date | undefined', default: 'undefined' },
  { name: 'weekStartsOn', type: '0 | 1 | 2 | 3 | 4 | 5 | 6', default: '0' },
  { name: 'placeholder', type: 'string', default: "'Select a date'" },
];

@Component({
  selector: 'docs-date-picker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoDatePicker, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Date Picker"
      description="A single-date picker with a month-grid calendar dialog, full keyboard navigation, and ARIA grid semantics."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind a Date with [(value)]; the trigger opens a month-grid calendar dialog."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="date"
            ariaLabel="Date"
            placeholder="Choose a date"
          />
        </div>
        <div code>&lt;dg-date-picker [(value)]="date" ariaLabel="Date" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="min-max"
        title="Min / Max"
        description="min and max disable days outside the allowed range in the calendar grid."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="ranged"
            [min]="minDate"
            [max]="maxDate"
            ariaLabel="Date within range"
            placeholder="Within the next 30 days"
          />
        </div>
        <div code>
          &lt;dg-date-picker [(value)]="date" [min]="minDate" [max]="maxDate"
          /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DatePickerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly date = signal<Date | null>(null);
  protected readonly ranged = signal<Date | null>(null);
  protected readonly minDate = new Date();
  protected readonly maxDate = new Date(Date.now() + 30 * 864e5);
}
