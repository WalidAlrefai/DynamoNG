import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoDatePicker } from '@dynamong/date-picker';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-date-picker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoDatePicker, DocPageShell],
  template: `
    <docs-page-shell
      name="Date Picker"
      description="A single-date picker with a month-grid calendar dialog, full keyboard navigation, and ARIA grid semantics."
    >
      <div demo class="max-w-sm">
        <dg-date-picker ariaLabel="Date" placeholder="Choose a date" />
      </div>
      <div code>&lt;dg-date-picker [(value)]="date" ariaLabel="Date" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">Date | null (model)</td>
            <td class="py-2 font-mono">null</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">min</td>
            <td class="py-2 pr-4 font-mono">Date | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">max</td>
            <td class="py-2 pr-4 font-mono">Date | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">weekStartsOn</td>
            <td class="py-2 pr-4 font-mono">0 | 1 | 2 | 3 | 4 | 5 | 6</td>
            <td class="py-2 font-mono">0</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">placeholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Select a date'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class DatePickerDocPage {}
