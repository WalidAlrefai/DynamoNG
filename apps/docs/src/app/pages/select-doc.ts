import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoSelect } from '@dynamong/select';
import type { DynamoSelectOption } from '@dynamong/select';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const COUNTRY_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'Australia', value: 'au' },
  { label: 'Japan (disabled)', value: 'jp', disabled: true },
];

const PRODUCE_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Apple', value: 'apple', group: 'Fruits' },
  { label: 'Banana', value: 'banana', group: 'Fruits' },
  { label: 'Cherry', value: 'cherry', group: 'Fruits' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
  { label: 'Potato', value: 'potato', group: 'Vegetables' },
];

const MANY_OPTIONS: DynamoSelectOption<string>[] = Array.from(
  { length: 5000 },
  (_, i) => ({ label: `Option ${i + 1}`, value: `option-${i + 1}` }),
);

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'clearable', title: 'Clearable' },
  { id: 'filter', title: 'Filter' },
  { id: 'grouped', title: 'Grouped Options' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'forms', title: 'Reactive Forms' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

const API_ROWS: ApiTableRow[] = [
  { name: 'options', type: 'DynamoSelectOption[] (required)', default: '—' },
  { name: 'value', type: 'TValue | null (model)', default: 'null' },
  { name: 'placeholder', type: 'string', default: "'Select an option'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'invalid', type: 'boolean', default: 'false' },
  { name: 'clearable', type: 'boolean', default: 'false' },
  {
    name: 'position',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
  },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterText', type: 'string (model)', default: "''" },
  { name: 'filterPlaceholder', type: 'string', default: "'Search...'" },
  { name: 'noResultsMessage', type: 'string', default: "'No matching options'" },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '240' },
];

const BASIC_CODE = `<dg-select
  [options]="countries"
  [(value)]="country"
  ariaLabel="Country"
  placeholder="Choose a country" />`;

const CLEARABLE_CODE = `<dg-select
  [options]="countries"
  [(value)]="country"
  ariaLabel="Country"
  [clearable]="true" />`;

const FILTER_CODE = `<dg-select
  [options]="countries"
  ariaLabel="Country"
  placeholder="Choose a country"
  [filterable]="true"
  filterPlaceholder="Search countries…" />`;

const GROUPED_CODE = `// options carry a \`group\` field:
// { label: 'Apple', value: 'apple', group: 'Fruits' }

<dg-select
  [options]="produce"
  ariaLabel="Produce"
  placeholder="Choose an item" />`;

const SIZES_CODE = `<dg-select [options]="countries" size="sm" placeholder="Small" />
<dg-select [options]="countries" size="md" placeholder="Medium" />
<dg-select [options]="countries" size="lg" placeholder="Large" />`;

const DISABLED_CODE = `<!-- whole control -->
<dg-select [options]="countries" [disabled]="true" placeholder="Choose a country" />

<!-- a single option: { label: 'Japan', value: 'jp', disabled: true } -->`;

const INVALID_CODE = `<dg-select
  [options]="countries"
  [(value)]="country"
  ariaLabel="Country"
  placeholder="Choose a country"
  [invalid]="true" />`;

const FORMS_CODE = `countryControl = new FormControl<string | null>(null);

<dg-select
  [options]="countries"
  [formControl]="countryControl"
  ariaLabel="Country"
  placeholder="Choose a country" />`;

const VIRTUAL_SCROLL_CODE = `<dg-select
  [options]="manyOptions"   // 5,000 items
  ariaLabel="Option"
  placeholder="Choose from 5,000 options"
  [virtualScroll]="true" />`;

@Component({
  selector: 'docs-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoSelect,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Select"
      description="A single-select combobox with full keyboard navigation, ARIA combobox semantics, optional filtering, and a CDK-Overlay-positioned panel."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind an options array and a two-way value. The selected value is whatever option's value was picked."
        [code]="basicCode"
      >
        <div preview class="max-w-sm space-y-2">
          <dg-select
            [options]="countries"
            [(value)]="country"
            ariaLabel="Country"
            placeholder="Choose a country"
          />
          <p class="text-sm text-text-muted">
            Value: <span class="font-mono">{{ country() ?? '—' }}</span>
          </p>
        </div>
      </docs-example>

      <docs-example
        exampleId="clearable"
        title="Clearable"
        description="Set clearable to show an “x” in the trigger once a value is selected; it clears the value without opening the panel."
        [code]="clearableCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            [(value)]="clearableCountry"
            ariaLabel="Country"
            [clearable]="true"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="filter"
        title="Filter"
        description="Set filterable to render a search box above the list. Matching is case-insensitive on the option label."
        [code]="filterCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            ariaLabel="Country"
            placeholder="Choose a country"
            [filterable]="true"
            filterPlaceholder="Search countries…"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="grouped"
        title="Grouped Options"
        description="Give options a group field and the panel renders non-selectable group headings above each run of members."
        [code]="groupedCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="produce"
            ariaLabel="Produce"
            placeholder="Choose an item"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three trigger heights via the size input — sm, md (default), and lg."
        [code]="sizesCode"
      >
        <div preview class="flex max-w-sm flex-col gap-3">
          <dg-select
            [options]="countries"
            size="sm"
            ariaLabel="Small"
            placeholder="Small"
          />
          <dg-select
            [options]="countries"
            size="md"
            ariaLabel="Medium"
            placeholder="Medium"
          />
          <dg-select
            [options]="countries"
            size="lg"
            ariaLabel="Large"
            placeholder="Large"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled turns off the whole control. Individual options can also be disabled — the “Japan” option below is."
        [code]="disabledCode"
      >
        <div preview class="max-w-sm space-y-3">
          <dg-select
            [options]="countries"
            ariaLabel="Country (disabled)"
            placeholder="Choose a country"
            [disabled]="true"
          />
          <dg-select
            [options]="countries"
            ariaLabel="Country (option disabled)"
            placeholder="Try selecting Japan"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state without changing behavior."
        [code]="invalidCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            [(value)]="invalidCountry"
            ariaLabel="Country"
            placeholder="Choose a country"
            [invalid]="true"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="forms"
        title="Reactive Forms"
        description="Select is a ControlValueAccessor — bind a FormControl directly. Disabled state follows the control."
        [code]="formsCode"
      >
        <div preview class="max-w-sm space-y-2">
          <dg-select
            [options]="countries"
            [formControl]="countryControl"
            ariaLabel="Country"
            placeholder="Choose a country"
          />
          <p class="text-sm text-text-muted">
            value:
            <span class="font-mono">{{ countryControl.value ?? 'null' }}</span>
            · dirty:
            <span class="font-mono">{{ countryControl.dirty }}</span>
          </p>
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="Set virtualScroll for large option lists — only a small rendered window ever mounts in the DOM."
        [code]="virtualScrollCode"
      >
        <div preview class="max-w-sm space-y-2">
          <dg-select
            [options]="manyOptions"
            ariaLabel="Option (virtualized)"
            placeholder="Choose from 5,000 options"
            [virtualScroll]="true"
          />
          <p class="text-sm text-text-muted">
            5,000 options — only a small rendered window ever mounts in the DOM.
          </p>
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">virtualScroll</code> only takes effect for the
          ungrouped case — it's powered by
          <code class="font-mono">&#64;dynamong/virtual-scroll</code>, which is
          fixed-row-height only, and a grouped list's heading rows are a
          different height than option rows. A grouped/filterable-with-groups
          Select silently falls back to the full, non-virtualized render.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class SelectDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API_ROWS;

  protected readonly countries = COUNTRY_OPTIONS;
  protected readonly produce = PRODUCE_OPTIONS;
  protected readonly manyOptions = MANY_OPTIONS;

  protected readonly country = signal<string | null>(null);
  protected readonly clearableCountry = signal<string | null>('de');
  protected readonly invalidCountry = signal<string | null>(null);
  protected readonly countryControl = new FormControl<string | null>(null);

  protected readonly basicCode = BASIC_CODE;
  protected readonly clearableCode = CLEARABLE_CODE;
  protected readonly filterCode = FILTER_CODE;
  protected readonly groupedCode = GROUPED_CODE;
  protected readonly sizesCode = SIZES_CODE;
  protected readonly disabledCode = DISABLED_CODE;
  protected readonly invalidCode = INVALID_CODE;
  protected readonly formsCode = FORMS_CODE;
  protected readonly virtualScrollCode = VIRTUAL_SCROLL_CODE;
}
