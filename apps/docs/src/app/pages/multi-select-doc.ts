import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoMultiSelect } from '@dynamong/multi-select';
import type { DynamoSelectOption } from '@dynamong/multi-select';
import { DocPageShell } from '../components/doc-page-shell';

const SKILL_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Angular', value: 'angular' },
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'CSS (disabled)', value: 'css', disabled: true },
];

@Component({
  selector: 'docs-multi-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMultiSelect, DocPageShell],
  template: `
    <docs-page-shell
      name="Multi Select"
      description="A multi-select combobox with tag display, filtering, a header select-all/clear-all checkbox, a max-selection cap, and single-level option grouping."
    >
      <div demo class="max-w-sm">
        <dg-multi-select
          [options]="options"
          ariaLabel="Skills"
          placeholder="Choose skills"
          [filterable]="true"
          [maxVisibleTags]="3"
        />
      </div>
      <div code>
        &lt;dg-multi-select [options]="options" [(value)]="skills"
        ariaLabel="Skills" [filterable]="true" [maxVisibleTags]="3" /&gt;
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
            <td class="py-2 pr-4 font-mono">TValue[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">placeholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Select options'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">invalid</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">filterable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">maxSelected</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined (unlimited)</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">maxSelectedMessage</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Maximum selections reached'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showSelectAll</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selectAllLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Select all'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">maxVisibleTags</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined (show all)</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">tagRemoved</td>
            <td class="py-2 pr-4 font-mono">output&lt;TValue&gt;</td>
            <td class="py-2 font-mono">—</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class MultiSelectDocPage {
  protected readonly options = SKILL_OPTIONS;
}
