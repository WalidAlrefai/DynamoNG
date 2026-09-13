import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoInputNumber } from '@dynamong/input-number';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'bounds', title: 'Min / Max / Step' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'currency', title: 'Currency & Grouping' },
  { id: 'affixes', title: 'Prefix / Suffix' },
];

@Component({
  selector: 'docs-input-number-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoInputNumber,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
  ],
  template: `
    <docs-examples-layout
      name="Input Number"
      description="A numeric spinner input with increment/decrement buttons, keyboard stepping, and min/max/step bounds."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a FormControl (or ngModel). The value is a number or null."
        [code]="basicCode"
      >
        <div preview class="max-w-xs">
          <dg-input-number [formControl]="quantity" ariaLabel="Quantity" />
          <p class="mt-2 text-sm text-text-muted">
            Value:
            <span class="font-mono">{{ quantity.value ?? '(none)' }}</span>
          </p>
        </div>
      </docs-example>

      <docs-example
        exampleId="bounds"
        title="Min / Max / Step"
        description="Clamp to a range and step by a custom amount; the spinner buttons and Arrow keys respect both."
        [code]="boundsCode"
      >
        <div preview class="max-w-xs">
          <dg-input-number
            [formControl]="bounded"
            [min]="0"
            [max]="10"
            [step]="2"
            ariaLabel="Bounded quantity"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three control heights via the size input."
        [code]="sizesCode"
      >
        <div preview class="flex max-w-xs flex-col gap-3">
          <dg-input-number
            [formControl]="sizeCtl"
            size="sm"
            ariaLabel="Small"
          />
          <dg-input-number
            [formControl]="sizeCtl"
            size="md"
            ariaLabel="Medium"
          />
          <dg-input-number
            [formControl]="sizeCtl"
            size="lg"
            ariaLabel="Large"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="currency"
        title="Currency & Grouping"
        description="mode='currency' formats through Intl.NumberFormat while blurred; useGrouping adds thousands separators. The plain number is shown while editing."
        [code]="currencyCode"
      >
        <div preview class="max-w-xs">
          <dg-input-number
            [formControl]="price"
            mode="currency"
            currency="USD"
            locale="en-US"
            ariaLabel="Price"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="affixes"
        title="Prefix / Suffix"
        description="Literal text flush against the input, outside the editable value — e.g. a unit label."
        [code]="affixesCode"
      >
        <div preview class="max-w-xs">
          <dg-input-number
            [formControl]="rate"
            prefix="$"
            suffix="/mo"
            ariaLabel="Monthly rate"
          />
        </div>
      </docs-example>

      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">min</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">max</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">step</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">mode</td>
            <td class="py-2 pr-4 font-mono">'decimal' | 'currency'</td>
            <td class="py-2 font-mono">'decimal'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">currency</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">locale</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">useGrouping</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">minFractionDigits</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">maxFractionDigits</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">prefix</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">suffix</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
    </docs-examples-layout>
  `,
})
export class InputNumberDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly quantity = new FormControl<number | null>(3);
  protected readonly bounded = new FormControl<number | null>(4);
  protected readonly sizeCtl = new FormControl<number | null>(1);
  protected readonly price = new FormControl<number | null>(1234.5);
  protected readonly rate = new FormControl<number | null>(29);

  protected readonly basicCode = `<dg-input-number [formControl]="quantity" ariaLabel="Quantity" />`;
  protected readonly boundsCode = `<dg-input-number [formControl]="quantity" [min]="0" [max]="10" [step]="2" />`;
  protected readonly sizesCode = `<dg-input-number [formControl]="q" size="sm" />
<dg-input-number [formControl]="q" size="md" />
<dg-input-number [formControl]="q" size="lg" />`;
  protected readonly currencyCode = `<dg-input-number [formControl]="price" mode="currency" currency="USD" locale="en-US" />`;
  protected readonly affixesCode = `<dg-input-number [formControl]="rate" prefix="$" suffix="/mo" />`;
}
