import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoDatePicker } from '@dynamong/date-picker';
import {
  DynamoDateRangePicker,
  type DynamoDateRange,
} from '@dynamong/date-range-picker';
import { DynamoFloatLabel, DynamoIftaLabel } from '@dynamong/float-label';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'format', title: 'Format' },
  { id: 'mask', title: 'Mask' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'filled', title: 'Filled' },
  { id: 'fluid', title: 'Fluid' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'min-max', title: 'Min / Max' },
  { id: 'disabled-days', title: 'Disabled Dates & Weekdays' },
  { id: 'multiple', title: 'Multiple' },
  { id: 'clearable', title: 'Clearable' },
  { id: 'inline', title: 'Inline' },
  { id: 'float-label', title: 'Float Label' },
  { id: 'ifta-label', title: 'Ifta Label' },
  { id: 'month-picker', title: 'Month Picker' },
  { id: 'year-picker', title: 'Year Picker' },
  { id: 'multiple-months', title: 'Multiple Months' },
  { id: 'time', title: 'Time Picker' },
  { id: 'time-only', title: 'Time Picker Only' },
  { id: 'button-bar', title: 'Button Bar' },
  { id: 'range', title: 'Range Selection' },
  { id: 'forms', title: 'Reactive Forms' },
  { id: 'accessibility', title: 'Accessibility' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'Date | null (model)', default: 'null' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'variant', type: "'outlined' | 'filled'", default: "'outlined'" },
  { name: 'fluid', type: 'boolean', default: 'true' },
  { name: 'min', type: 'Date | undefined', default: 'undefined' },
  { name: 'max', type: 'Date | undefined', default: 'undefined' },
  { name: 'weekStartsOn', type: '0 | 1 | 2 | 3 | 4 | 5 | 6', default: '0' },
  { name: 'placeholder', type: 'string', default: "'Select a date'" },
  { name: 'invalid', type: 'boolean', default: 'false' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'locale', type: 'string | undefined', default: 'undefined' },
  { name: 'dateFormat', type: 'string | undefined', default: 'undefined' },
  { name: 'mask', type: 'boolean', default: 'false' },
  {
    name: 'view',
    type: "'date' | 'month' | 'year' | 'time'",
    default: "'date'",
  },
  { name: 'numberOfMonths', type: 'number', default: '1' },
  {
    name: 'selectionMode',
    type: "'single' | 'multiple'",
    default: "'single'",
  },
  { name: 'values', type: 'Date[] (model)', default: '[]' },
  { name: 'disabledDates', type: 'Date[]', default: '[]' },
  { name: 'disabledDays', type: 'number[]', default: '[]' },
  { name: 'clearable', type: 'boolean', default: 'false' },
  { name: 'inline', type: 'boolean', default: 'false' },
  { name: 'showTime', type: 'boolean', default: 'false' },
  { name: 'hourFormat', type: "'12' | '24'", default: "'24'" },
  { name: 'showSeconds', type: 'boolean', default: 'false' },
  { name: 'showButtonBar', type: 'boolean', default: 'false' },
];

const EMPTY_RANGE: DynamoDateRange = { start: null, end: null };

@Component({
  selector: 'docs-date-picker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoDatePicker,
    DynamoDateRangePicker,
    DynamoFloatLabel,
    DynamoIftaLabel,
    ReactiveFormsModule,
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
        exampleId="format"
        title="Format"
        description="dateFormat is a small token format string (d/dd/m/mm/yy/yyyy + literals) governing both the displayed/typed text and what typing parses against. Unset infers the format from locale instead."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="formatDemoDate"
            dateFormat="yyyy-mm-dd"
            ariaLabel="Date (yyyy-mm-dd)"
            placeholder="yyyy-mm-dd"
          />
        </div>
        <div code>&lt;dg-date-picker dateFormat="yyyy-mm-dd" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="mask"
        title="Mask"
        description="mask applies a digit-only mask derived from dateFormat's tokens as you type. Requires a fixed-width format (dd/mm/yyyy, not the flexible d/m) — a no-op otherwise."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="maskDemoDate"
            dateFormat="mm/dd/yyyy"
            [mask]="true"
            ariaLabel="Date (mm/dd/yyyy, masked)"
            placeholder="mm/dd/yyyy"
          />
        </div>
        <div code>
          &lt;dg-date-picker dateFormat="mm/dd/yyyy" [mask]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three heights via the size input."
      >
        <div preview class="flex flex-col gap-2 max-w-sm">
          <dg-date-picker size="sm" ariaLabel="Small" placeholder="Small" />
          <dg-date-picker size="md" ariaLabel="Medium" placeholder="Medium" />
          <dg-date-picker size="lg" ariaLabel="Large" placeholder="Large" />
        </div>
        <div code>
          &lt;dg-date-picker size="sm" /&gt; &lt;dg-date-picker size="lg" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="filled"
        title="Filled"
        description='variant "filled" swaps the outlined look for a filled surface background.'
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            variant="filled"
            ariaLabel="Filled example"
            placeholder="Filled"
          />
        </div>
        <div code>&lt;dg-date-picker variant="filled" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="fluid"
        title="Fluid"
        description="fluid defaults true (fills its container); set false for intrinsic, content-driven width."
      >
        <div
          preview
          class="flex flex-col gap-3 max-w-sm rounded-lg border border-border p-4"
        >
          <div>
            <p class="mb-1 text-xs text-text-muted">fluid (default)</p>
            <dg-date-picker ariaLabel="Fluid" placeholder="Fills container" />
          </div>
          <div>
            <p class="mb-1 text-xs text-text-muted">[fluid]="false"</p>
            <dg-date-picker
              [fluid]="false"
              ariaLabel="Not fluid"
              placeholder="Intrinsic"
            />
          </div>
        </div>
        <div code>&lt;dg-date-picker [fluid]="false" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [invalid]="true"
            ariaLabel="Invalid example"
            placeholder="Invalid state"
          />
        </div>
        <div code>&lt;dg-date-picker [invalid]="true" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the trigger out and blocks opening the calendar."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [disabled]="true"
            ariaLabel="Disabled example"
            placeholder="Disabled"
          />
        </div>
        <div code>&lt;dg-date-picker [disabled]="true" /&gt;</div>
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
        exampleId="multiple"
        title="Multiple"
        description='selectionMode="multiple" lets you pick several individual dates — clicking a day toggles it in/out of a [(values)] array instead of committing/closing; the panel stays open across picks (close via Escape, the icon button, or an outside click). view="date" only.'
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(values)]="multipleDates"
            selectionMode="multiple"
            [clearable]="true"
            ariaLabel="Dates"
            placeholder="Choose dates"
          />
        </div>
        <div code>
          &lt;dg-date-picker selectionMode="multiple" [(values)]="dates" /&gt;
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
        exampleId="float-label"
        title="Float Label"
        description="Compose with @dynamong/float-label's dg-float-label — now works since the trigger is a real typable input carrying a placeholder for :placeholder-shown to key off of. See the Float Label page for every variant."
      >
        <div preview class="max-w-xs">
          <dg-float-label label="Appointment" variant="over">
            <dg-date-picker
              [(value)]="floatLabelDate"
              placeholder=" "
              ariaLabel="Appointment"
            />
          </dg-float-label>
        </div>
        <div code>
          &lt;dg-float-label label="Appointment"&gt; &lt;dg-date-picker
          placeholder=" " /&gt; &lt;/dg-float-label&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="ifta-label"
        title="Ifta Label"
        description="Compose with dg-ifta-label for an always-visible, in-the-field label. See the Float Label page for details."
      >
        <div preview class="max-w-xs">
          <dg-ifta-label label="Deadline">
            <dg-date-picker
              [(value)]="iftaLabelDate"
              placeholder=" "
              ariaLabel="Deadline"
            />
          </dg-ifta-label>
        </div>
        <div code>
          &lt;dg-ifta-label label="Deadline"&gt; &lt;dg-date-picker
          placeholder=" " /&gt; &lt;/dg-ifta-label&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="month-picker"
        title="Month Picker"
        description='view="month" replaces the day grid with a committing 12-month grid — the trigger shows just the month and year. The existing quick-jump (from the Basic example&apos;s month/year header label) only navigates; this is a separate top-level view where picking a month commits it.'
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="monthPickerDate"
            view="month"
            ariaLabel="Month"
            placeholder="Choose a month"
          />
        </div>
        <div code>&lt;dg-date-picker view="month" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="year-picker"
        title="Year Picker"
        description='view="year" replaces the day grid with a committing 12-year grid (a fixed block, stepped a full block at a time) — the trigger shows just the year.'
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="yearPickerDate"
            view="year"
            ariaLabel="Year"
            placeholder="Choose a year"
          />
        </div>
        <div code>&lt;dg-date-picker view="year" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="multiple-months"
        title="Multiple Months"
        description='numberOfMonths renders that many consecutive months side by side (view="date" only). Previous/Next always shifts the whole window by one month, not by numberOfMonths.'
      >
        <div preview>
          <dg-date-picker
            [(value)]="multiMonthDate"
            [numberOfMonths]="2"
            ariaLabel="Date"
            placeholder="Choose a date"
          />
        </div>
        <div code>&lt;dg-date-picker [numberOfMonths]="2" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="time"
        title="Time Picker"
        description="showTime renders hour/minute steppers below the calendar. Picking a day no longer closes the panel — an Apply button does that once the time is set too."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="timedDate"
            [showTime]="true"
            ariaLabel="Appointment date and time"
            placeholder="Choose a date and time"
          />
        </div>
        <div code>
          &lt;dg-date-picker [(value)]="date" [showTime]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="time-only"
        title="Time Picker Only"
        description="view=&quot;time&quot; drops the calendar entirely — just hour/minute(/second) steppers, for time-of-day-only input. showTime is ignored (assumed on) in this view; the date part stays pinned to the existing value's date, or today's if unset."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="timeOnlyDate"
            view="time"
            ariaLabel="Time"
            placeholder="Choose a time"
          />
        </div>
        <div code>&lt;dg-date-picker view="time" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="button-bar"
        title="Button Bar"
        description="showButtonBar adds a Today/Clear footer below the calendar."
      >
        <div preview class="max-w-sm">
          <dg-date-picker
            [(value)]="buttonBarDate"
            [showButtonBar]="true"
            ariaLabel="Date"
          />
        </div>
        <div code>
          &lt;dg-date-picker [(value)]="date" [showButtonBar]="true" /&gt;
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

      <docs-example
        exampleId="forms"
        title="Reactive Forms"
        description="DatePicker is a ControlValueAccessor — bind a FormControl directly. Disabled state follows the control."
      >
        <div preview class="max-w-sm space-y-2">
          <dg-date-picker [formControl]="dateControl" ariaLabel="Date" />
          <p class="text-sm text-text-muted">
            value:
            <span class="font-mono">{{
              dateControl.value ? dateControl.value.toDateString() : 'null'
            }}</span>
            · dirty: <span class="font-mono">{{ dateControl.dirty }}</span>
          </p>
        </div>
        <div code>&lt;dg-date-picker [formControl]="dateControl" /&gt;</div>
      </docs-example>

      <section id="accessibility" class="space-y-3">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Accessibility
        </h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-text-primary">
          <li>
            The trigger has
            <code class="font-mono">aria-haspopup="dialog"</code>,
            <code class="font-mono">aria-expanded</code>, and
            <code class="font-mono">aria-controls</code> pointing at the panel.
          </li>
          <li>
            The panel is a <code class="font-mono">role="dialog"</code> with an
            <code class="font-mono">aria-live="polite"</code> region announcing
            the visible month, and a
            <code class="font-mono">role="grid"</code> day table with full
            roving-tabindex keyboard navigation (arrow keys, Home/End,
            PageUp/PageDown, Shift+PageUp/PageDown for year).
          </li>
          <li>
            <code class="font-mono">ariaDescribedby</code> associates an
            external help/error message's <code class="font-mono">id</code>
            with the trigger, same as InputText's.
          </li>
          <li>
            The trigger is a real <code class="font-mono">role="combobox"</code>
            <code class="font-mono">&lt;input&gt;</code> — typing is optional
            (parsed via <code class="font-mono">dateFormat</code>/locale on
            Enter or blur); clicking or focusing it never steals focus away, so
            typing stays possible the instant you click in. The small
            calendar-icon button (<code class="font-mono"
              >aria-label="Open calendar"</code
            >) and <code class="font-mono">ArrowDown</code>/<code
              class="font-mono"
              >Enter</code
            >
            open the panel and move focus into the day grid for keyboard
            navigation.
          </li>
          <li>
            <code class="font-mono">view="month"</code>/<code class="font-mono"
              >"year"</code
            >
            replace the day grid with a committing month/year grid, get the same
            open-time focus treatment (focus lands on the current selection),
            and keep the trigger read-only-for-typing — no format/mask grammar
            is built for month/year text.
          </li>
          <li>
            Time steppers (<code class="font-mono">showTime</code> or
            <code class="font-mono">view="time"</code>) use
            <code class="font-mono">role="spinbutton"</code> with
            <code class="font-mono">aria-valuenow</code>/<code class="font-mono"
              >valuemin</code
            >/<code class="font-mono">valuemax</code>/<code class="font-mono"
              >valuetext</code
            >. <code class="font-mono">view="time"</code> drops the calendar and
            month header entirely — its dialog falls back to a literal "Choose a
            time" <code class="font-mono">aria-label</code> when
            <code class="font-mono">ariaLabel</code> isn't set, since there's no
            month label to point <code class="font-mono">aria-labelledby</code>
            at.
          </li>
          <li>
            <code class="font-mono">selectionMode="multiple"</code> toggles
            <code class="font-mono">aria-selected</code> on each picked day's
            cell and keeps the trigger read-only-for-typing, same scope cut as
            the other non-typable views;
            <code class="font-mono">view="date"</code> only.
          </li>
        </ul>
        <p class="text-sm text-text-muted">
          Need a two-date range instead of a single date? Use
          <code class="font-mono">dg-date-range-picker</code>
          (<code class="font-mono">@dynamong/date-range-picker</code>) — see the
          Range Selection example above. It's a separate sibling component
          sharing this same input surface, not a mode of
          <code class="font-mono">dg-date-picker</code> itself.
        </p>
      </section>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DatePickerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly date = signal<Date | null>(null);
  protected readonly formatDemoDate = signal<Date | null>(null);
  protected readonly maskDemoDate = signal<Date | null>(null);
  protected readonly floatLabelDate = signal<Date | null>(null);
  protected readonly iftaLabelDate = signal<Date | null>(null);
  protected readonly monthPickerDate = signal<Date | null>(null);
  protected readonly yearPickerDate = signal<Date | null>(null);
  protected readonly multiMonthDate = signal<Date | null>(null);
  protected readonly ranged = signal<Date | null>(null);
  protected readonly minDate = new Date();
  protected readonly maxDate = new Date(Date.now() + 30 * 864e5);
  protected readonly weekdayOnly = signal<Date | null>(null);
  protected readonly multipleDates = signal<Date[]>([]);
  protected readonly clearableDate = signal<Date | null>(new Date());
  protected readonly inlineDate = signal<Date | null>(null);
  protected readonly timedDate = signal<Date | null>(null);
  protected readonly timeOnlyDate = signal<Date | null>(null);
  protected readonly buttonBarDate = signal<Date | null>(null);
  protected readonly range = signal<DynamoDateRange>(EMPTY_RANGE);
  protected readonly dateControl = new FormControl<Date | null>(null);
}
