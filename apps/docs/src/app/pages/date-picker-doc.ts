import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoDatePicker } from '@dynamong/date-picker';
import {
  DynamoDateRangePicker,
  type DynamoDateRange,
} from '@dynamong/date-range-picker';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'min-max', title: 'Min / Max' },
  { id: 'disabled-days', title: 'Disabled Dates & Weekdays' },
  { id: 'clearable', title: 'Clearable' },
  { id: 'inline', title: 'Inline' },
  { id: 'range', title: 'Range Selection' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'Date | null (model)', default: 'null' },
  { name: 'min', type: 'Date | undefined', default: 'undefined' },
  { name: 'max', type: 'Date | undefined', default: 'undefined' },
  { name: 'weekStartsOn', type: '0 | 1 | 2 | 3 | 4 | 5 | 6', default: '0' },
  { name: 'placeholder', type: 'string', default: "'Select a date'" },
  { name: 'disabledDates', type: 'Date[]', default: '[]' },
  { name: 'disabledDays', type: 'number[]', default: '[]' },
  { name: 'clearable', type: 'boolean', default: 'false' },
  { name: 'inline', type: 'boolean', default: 'false' },
];

const EMPTY_RANGE: DynamoDateRange = { start: null, end: null };

@Component({
  selector: 'docs-date-picker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoDatePicker,
    DynamoDateRangePicker,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Date Picker"
      description="A single-date picker with a month-grid calendar dialog, full keyboard navigation, and ARIA grid semantics — plus a two-date range variant (dg-date-range-picker) built on the same calendar."
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
        <div code>
          &lt;dg-date-picker [(value)]="date" ariaLabel="Date" /&gt;
        </div>
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

      <docs-example
        exampleId="disabled-days"
        title="Disabled Dates & Weekdays"
        description="disabledDates blocks specific days (e.g. holidays); disabledDays blocks entire weekdays (e.g. weekends) — both on top of any min/max range."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="weekdayOnly"
            [disabledDays]="[0, 6]"
            ariaLabel="Weekday appointment"
            placeholder="Pick a weekday"
          />
        </div>
        <div code>
          &lt;dg-date-picker [(value)]="date" [disabledDays]="[0, 6]" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="clearable"
        title="Clearable"
        description="clearable shows a × button next to the trigger once a value is selected."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="clearableDate"
            [clearable]="true"
            ariaLabel="Date"
          />
        </div>
        <div code>
          &lt;dg-date-picker [(value)]="date" [clearable]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="inline"
        title="Inline"
        description="inline renders the calendar directly in the page, with no trigger button or overlay."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="inlineDate"
            [inline]="true"
            ariaLabel="Date"
          />
        </div>
        <div code>
          &lt;dg-date-picker [(value)]="date" [inline]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="range"
        title="Range Selection"
        description="dg-date-range-picker (@dynamong/date-range-picker) shares this exact input surface with dg-date-picker above — min/max, disabledDates/disabledDays, clearable, and inline all work identically. Only value differs: a DynamoDateRange ({{
          '{'
        }} start: Date | null; end: Date | null {{
          '}'
        }}) instead of a single Date. Click a start date, then an end date — clicking before the current start redefines the range rather than resetting it."
      >
        <div preview class="max-w-sm">
          <dg-date-range-picker
            [(value)]="range"
            ariaLabel="Date range"
            placeholder="Choose a date range"
          />
        </div>
        <div code>
          &lt;dg-date-range-picker [(value)]="range" ariaLabel="Date range"
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
  protected readonly weekdayOnly = signal<Date | null>(null);
  protected readonly clearableDate = signal<Date | null>(new Date());
  protected readonly inlineDate = signal<Date | null>(null);
  protected readonly range = signal<DynamoDateRange>(EMPTY_RANGE);
}
