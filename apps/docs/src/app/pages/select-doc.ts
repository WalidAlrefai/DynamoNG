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

@Component({
  selector: 'docs-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSelect, DocPageShell],
  template: `
    <docs-page-shell
      name="Select"
      description="A single-select combobox with full keyboard navigation and ARIA combobox semantics."
    >
      <div demo class="max-w-sm">
        <dg-select [options]="options" ariaLabel="Country" placeholder="Choose a country" />
      </div>
      <div code>&lt;dg-select [options]="options" [(value)]="country" ariaLabel="Country" /&gt;</div>
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
          <tr>
            <td class="py-2 pr-4 font-mono">placeholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Select an option'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class SelectDocPage {
  protected readonly options = COUNTRY_OPTIONS;
}
