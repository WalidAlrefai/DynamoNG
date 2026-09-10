import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoAutocomplete } from '@dynamong/autocomplete';
import type { DynamoSelectOption } from '@dynamong/autocomplete';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const FRUIT_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Apricot', value: 'apricot' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Grape (disabled)', value: 'grape', disabled: true },
  { label: 'Mango', value: 'mango' },
];

const MANY_OPTIONS: DynamoSelectOption<string>[] = Array.from(
  { length: 5000 },
  (_, i) => ({ label: `Item ${i + 1}`, value: `item-${i + 1}` }),
);

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

@Component({
  selector: 'docs-autocomplete-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAutocomplete, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Autocomplete"
      description="A text input with filtered, keyboard-navigable suggestions."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind options and a text value; (optionSelect) fires when a suggestion is chosen."
      >
        <div preview class="max-w-sm">
          <dg-autocomplete
            [options]="options"
            [(value)]="fruit"
            (optionSelect)="lastSelected.set($event.label)"
            ariaLabel="Fruit"
            placeholder="Start typing a fruit..."
          />
          @if (lastSelected(); as selected) {
            <p class="mt-2 text-sm text-text-muted">
              Last selected: <span class="font-mono">{{ selected }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-autocomplete [options]="options" [(value)]="fruit"
          (optionSelect)="onSelect($event)" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="Set virtualScroll for large suggestion lists — only a small rendered window mounts."
      >
        <div preview class="max-w-sm">
          <dg-autocomplete
            [options]="manyOptions"
            ariaLabel="Item (virtualized)"
            placeholder="Type to filter 5,000 items..."
            [virtualScroll]="true"
          />
          <p class="mt-2 text-sm text-text-muted">
            5,000 suggestions — only a small rendered window ever mounts in the
            DOM.
          </p>
        </div>
        <div code>
          &lt;dg-autocomplete [options]="manyOptions" [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-text-muted">
              <th class="py-2 pr-4">Input</th>
              <th class="py-2 pr-4">Type</th>
              <th class="py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">options</td>
              <td class="py-2 pr-4 font-mono">
                &#123; label: string; value: T; disabled?: boolean; group?:
                string &#125;[]
              </td>
              <td class="py-2 font-mono">required</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">value</td>
              <td class="py-2 pr-4 font-mono">string (model)</td>
              <td class="py-2 font-mono">''</td>
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
              <td class="py-2 pr-4 font-mono">noResultsMessage</td>
              <td class="py-2 pr-4 font-mono">string</td>
              <td class="py-2 font-mono">'No matching options'</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">virtualScroll</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">virtualScrollItemSize / Height</td>
              <td class="py-2 pr-4 font-mono">number</td>
              <td class="py-2 font-mono">36 / 240</td>
            </tr>
          </tbody>
        </table>
        <p class="text-sm text-text-muted">
          <code class="font-mono">virtualScroll</code> only takes effect for the
          ungrouped case — it's powered by
          <code class="font-mono">&#64;dynamong/virtual-scroll</code>, which is
          fixed-row-height only. A grouped Autocomplete falls back to the full,
          non-virtualized render.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class AutocompleteDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly options = FRUIT_OPTIONS;
  protected readonly manyOptions = MANY_OPTIONS;
  protected readonly fruit = signal('');
  protected readonly lastSelected = signal<string | null>(null);
}
