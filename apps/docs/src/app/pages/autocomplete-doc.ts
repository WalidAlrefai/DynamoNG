import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoAutocomplete } from '@dynamong/autocomplete';
import type { DynamoSelectOption } from '@dynamong/autocomplete';
import { DocPageShell } from '../components/doc-page-shell';

const FRUIT_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Apricot', value: 'apricot' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Grape (disabled)', value: 'grape', disabled: true },
  { label: 'Mango', value: 'mango' },
];

@Component({
  selector: 'docs-autocomplete-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAutocomplete, DocPageShell],
  template: `
    <docs-page-shell
      name="Autocomplete"
      description="A text input with filtered, keyboard-navigable suggestions."
    >
      <div demo class="max-w-sm">
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
            <td class="py-2 pr-4 font-mono">placeholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
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
          <tr>
            <td class="py-2 pr-4 font-mono">noResultsMessage</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'No matching options'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class AutocompleteDocPage {
  protected readonly options = FRUIT_OPTIONS;
  protected readonly fruit = signal('');
  protected readonly lastSelected = signal<string | null>(null);
}
