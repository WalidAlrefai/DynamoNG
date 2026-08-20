import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSelect } from '@dynamong/select';
import type { DynamoSelectOption } from '@dynamong/select';
import { DocPageShell } from '../components/doc-page-shell';

const COUNTRY_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan (disabled)', value: 'jp', disabled: true },
];

const GROUPED_CITY_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'New York', value: 'nyc', group: 'United States' },
  { label: 'Los Angeles', value: 'la', group: 'United States' },
  { label: 'Toronto', value: 'toronto', group: 'Canada' },
  { label: 'Vancouver', value: 'vancouver', group: 'Canada' },
  { label: 'Berlin', value: 'berlin', group: 'Germany' },
];

@Component({
  selector: 'docs-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSelect, DocPageShell],
  template: `
    <docs-page-shell
      name="Select"
      description="A single-select combobox with full keyboard navigation, ARIA combobox semantics, optional filtering, and a CDK-Overlay-positioned panel."
    >
      <div demo class="max-w-sm">
        <dg-select
          [options]="options"
          ariaLabel="Country"
          placeholder="Choose a country"
          [clearable]="true"
        />
      </div>
      <div code>
        &lt;dg-select [options]="options" [(value)]="country"
        ariaLabel="Country" [clearable]="true" /&gt;
      </div>
      <div demo class="max-w-sm">
        <dg-select
          [options]="groupedOptions"
          ariaLabel="City"
          placeholder="Choose a city"
          [filterable]="true"
          filterPlaceholder="Search cities..."
        />
      </div>
      <div code>
        &lt;dg-select [options]="groupedOptions" ariaLabel="City"
        [filterable]="true" filterPlaceholder="Search cities..." /&gt;
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
            <td class="py-2 pr-4 font-mono">DynamoSelectOption[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">TValue | null (model)</td>
            <td class="py-2 font-mono">null</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">placeholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Select an option'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">invalid</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">clearable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">
              'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
            </td>
            <td class="py-2 font-mono">'bottom-start'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">filterable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">filterText</td>
            <td class="py-2 pr-4 font-mono">string (model)</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">filterPlaceholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Search...'</td>
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
export class SelectDocPage {
  protected readonly options = COUNTRY_OPTIONS;
  protected readonly groupedOptions = GROUPED_CITY_OPTIONS;
}
