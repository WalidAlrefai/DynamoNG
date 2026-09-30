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
  { id: 'checkmark', title: 'Checkmark' },
  { id: 'checkbox-selection', title: 'Checkbox Selection' },
  { id: 'template', title: 'Template' },
  { id: 'editable', title: 'Editable' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'filled', title: 'Filled' },
  { id: 'fluid', title: 'Fluid' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'readonly', title: 'Read-only' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'forms', title: 'Reactive Forms' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
  { id: 'accessibility', title: 'Accessibility' },
];

const API_ROWS: ApiTableRow[] = [
  { name: 'options', type: 'DynamoSelectOption[] (required)', default: '—' },
  { name: 'value', type: 'TValue | null (model)', default: 'null' },
  { name: 'placeholder', type: 'string', default: "'Select an option'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'variant', type: "'outlined' | 'filled'", default: "'outlined'" },
  { name: 'fluid', type: 'boolean', default: 'true' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'invalid', type: 'boolean', default: 'false' },
  { name: 'readOnly', type: 'boolean', default: 'false' },
  { name: 'clearable', type: 'boolean', default: 'false' },
  {
    name: 'position',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
  },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterText', type: 'string (model)', default: "''" },
  { name: 'filterPlaceholder', type: 'string', default: "'Search...'" },
  {
    name: 'noResultsMessage',
    type: 'string',
    default: "'No matching options'",
  },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '240' },
  {
    name: 'selectedIndicator',
    type: "'none' | 'checkmark' | 'checkbox'",
    default: "'none'",
  },
  { name: 'editable', type: 'boolean', default: 'false' },
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

const CHECKMARK_CODE = `<dg-select
  [options]="countries"
  [(value)]="checkmarkCountry"
  ariaLabel="Country"
  selectedIndicator="checkmark" />`;

const CHECKBOX_SELECTION_CODE = `<dg-select
  [options]="countries"
  [(value)]="checkboxSelectionCountry"
  ariaLabel="Country"
  selectedIndicator="checkbox" />`;

const TEMPLATE_CODE = `<dg-select [options]="countries" [(value)]="templateCountry" ariaLabel="Country">
  <ng-template #optionTemplate let-option>
    <span class="inline-block h-2.5 w-2.5 rounded-full bg-primary"></span>
    <span>{{ option.label }}</span>
  </ng-template>
</dg-select>`;

const EDITABLE_CODE = `<dg-select
  [options]="countries"
  [(value)]="editableCountry"
  ariaLabel="Country"
  placeholder="Type or pick a country"
  [editable]="true" />`;

const SIZES_CODE = `<dg-select [options]="countries" size="sm" placeholder="Small" />
<dg-select [options]="countries" size="md" placeholder="Medium" />
<dg-select [options]="countries" size="lg" placeholder="Large" />`;

const FILLED_CODE = `<dg-select
  [options]="countries"
  variant="filled"
  ariaLabel="Country"
  placeholder="Choose a country" />`;

const FLUID_CODE = `<dg-select [options]="countries" [fluid]="false" placeholder="Intrinsic" />`;

const DISABLED_CODE = `<!-- whole control -->
<dg-select [options]="countries" [disabled]="true" placeholder="Choose a country" />

<!-- a single option: { label: 'Japan', value: 'jp', disabled: true } -->`;

const READONLY_CODE = `<dg-select
  [options]="countries"
  [value]="'us'"
  ariaLabel="Country"
  [readOnly]="true" />`;

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
        exampleId="checkmark"
        title="Checkmark"
        description='selectedIndicator="checkmark" renders a check icon at the trailing edge of the selected option.'
        [code]="checkmarkCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            [(value)]="checkmarkCountry"
            ariaLabel="Country"
            selectedIndicator="checkmark"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="checkbox-selection"
        title="Checkbox Selection"
        description='selectedIndicator="checkbox" renders a decorative checkbox-look indicator at the leading edge of every option, checked for the current value — still single-select underneath.'
        [code]="checkboxSelectionCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            [(value)]="checkboxSelectionCountry"
            ariaLabel="Country"
            selectedIndicator="checkbox"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="template"
        title="Template"
        description="Project an #optionTemplate to render arbitrary content per option (falls back to plain text when omitted). #groupTemplate and #selectedTemplate customize group headings and the trigger's own selected-value display the same way."
        [code]="templateCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            [(value)]="templateCountry"
            ariaLabel="Country"
          >
            <ng-template #optionTemplate let-option>
              <span
                class="inline-block h-2.5 w-2.5 rounded-full bg-primary"
              ></span>
              <span>{{ option.label }}</span>
            </ng-template>
          </dg-select>
        </div>
      </docs-example>

      <docs-example
        exampleId="editable"
        title="Editable"
        description="editable swaps the trigger for a real typable input. Typing a value that doesn't match any option's label commits it directly as a free-text value on blur/Enter; typing an existing option's label selects that option properly. Mutually exclusive with filterable."
        [code]="editableCode"
      >
        <div preview class="max-w-sm space-y-2">
          <dg-select
            [options]="countries"
            [(value)]="editableCountry"
            ariaLabel="Country"
            placeholder="Type or pick a country"
            [editable]="true"
          />
          <p class="text-sm text-text-muted">
            Value:
            <span class="font-mono">{{ editableCountry() ?? '—' }}</span>
          </p>
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
        exampleId="filled"
        title="Filled"
        description='variant "filled" swaps the outlined look for a filled surface background.'
        [code]="filledCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            variant="filled"
            ariaLabel="Filled example"
            placeholder="Choose a country"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="fluid"
        title="Fluid"
        description="fluid defaults true (fills its container); set false for intrinsic, content-driven width."
        [code]="fluidCode"
      >
        <div
          preview
          class="flex flex-col gap-3 max-w-sm rounded-lg border border-border p-4"
        >
          <div>
            <p class="mb-1 text-xs text-text-muted">fluid (default)</p>
            <dg-select
              [options]="countries"
              ariaLabel="Fluid"
              placeholder="Fills container"
            />
          </div>
          <div>
            <p class="mb-1 text-xs text-text-muted">[fluid]="false"</p>
            <dg-select
              [options]="countries"
              [fluid]="false"
              ariaLabel="Not fluid"
              placeholder="Intrinsic"
            />
          </div>
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
        exampleId="readonly"
        title="Read-only"
        description="readOnly keeps the trigger/panel browsable but blocks changing or clearing the value — unlike disabled, it doesn't dim the trigger or remove it from the tab order."
        [code]="readonlyCode"
      >
        <div preview class="max-w-sm">
          <dg-select
            [options]="countries"
            [value]="'us'"
            ariaLabel="Country (read-only)"
            [readOnly]="true"
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

      <section id="accessibility" class="space-y-3">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Accessibility
        </h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-text-primary">
          <li>
            The trigger is a real <code class="font-mono">role="combobox"</code>
            <code class="font-mono">&lt;button&gt;</code> with
            <code class="font-mono">aria-haspopup="listbox"</code>,
            <code class="font-mono">aria-expanded</code>,
            <code class="font-mono">aria-controls</code>, and
            <code class="font-mono">aria-activedescendant</code> pointing at the
            currently-highlighted option.
          </li>
          <li>
            The panel is a <code class="font-mono">role="listbox"</code> with
            <code class="font-mono">role="option"</code> rows —
            <code class="font-mono">aria-selected</code> marks the current
            value, <code class="font-mono">aria-disabled</code> marks
            individually-disabled options and (while
            <code class="font-mono">readOnly</code> is set) every option.
          </li>
          <li>
            Full keyboard support: <code class="font-mono">ArrowUp</code>/<code
              class="font-mono"
              >ArrowDown</code
            >
            move the highlighted option (wrapping, skipping disabled rows),
            <code class="font-mono">Home</code>/<code class="font-mono"
              >End</code
            >
            jump to the first/last enabled option,
            <code class="font-mono">Enter</code>/<code class="font-mono"
              >Space</code
            >
            select, <code class="font-mono">Escape</code> closes, and typing a
            printable character (outside
            <code class="font-mono">filterable</code>) jumps to the next option
            starting with that text.
          </li>
          <li>
            <code class="font-mono">ariaDescribedby</code> associates an
            external help/error message's <code class="font-mono">id</code>
            with the trigger, same as InputText's.
          </li>
          <li>
            <strong>Known limitation:</strong>
            <code class="font-mono">dg-float-label</code>/<code
              class="font-mono"
              >dg-ifta-label</code
            >
            key off a real <code class="font-mono">&lt;input&gt;</code>/<code
              class="font-mono"
              >&lt;textarea&gt;</code
            >'s native <code class="font-mono">:placeholder-shown</code>
            state to decide when to float — Select's default trigger is a
            <code class="font-mono">&lt;button&gt;</code>, so it doesn't
            visually float unless <code class="font-mono">editable</code> is
            set, which renders a real
            <code class="font-mono">&lt;input&gt;</code>
            that composes with them normally.
          </li>
        </ul>
      </section>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">virtualScroll</code> only takes effect for the
          ungrouped case — it's powered by
          <code class="font-mono">&#64;dynamong/virtual-scroll</code>, which is
          fixed-row-height only, and a grouped list's heading rows are a
          different height than option rows. A grouped/filterable-with-groups
          Select silently falls back to the full, non-virtualized render.
          <code class="font-mono">scrolledIndexChange</code> forwards that same
          virtual-scroll viewport's own output 1:1, for driving your own
          lazy-load fetch as the index nears the end of the list.
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
  protected readonly checkmarkCountry = signal<string | null>('us');
  protected readonly checkboxSelectionCountry = signal<string | null>('us');
  protected readonly templateCountry = signal<string | null>('us');
  protected readonly editableCountry = signal<string | null>(null);
  protected readonly invalidCountry = signal<string | null>(null);
  protected readonly countryControl = new FormControl<string | null>(null);

  protected readonly basicCode = BASIC_CODE;
  protected readonly clearableCode = CLEARABLE_CODE;
  protected readonly filterCode = FILTER_CODE;
  protected readonly groupedCode = GROUPED_CODE;
  protected readonly checkmarkCode = CHECKMARK_CODE;
  protected readonly checkboxSelectionCode = CHECKBOX_SELECTION_CODE;
  protected readonly templateCode = TEMPLATE_CODE;
  protected readonly editableCode = EDITABLE_CODE;
  protected readonly sizesCode = SIZES_CODE;
  protected readonly filledCode = FILLED_CODE;
  protected readonly fluidCode = FLUID_CODE;
  protected readonly disabledCode = DISABLED_CODE;
  protected readonly readonlyCode = READONLY_CODE;
  protected readonly invalidCode = INVALID_CODE;
  protected readonly formsCode = FORMS_CODE;
  protected readonly virtualScrollCode = VIRTUAL_SCROLL_CODE;
}
