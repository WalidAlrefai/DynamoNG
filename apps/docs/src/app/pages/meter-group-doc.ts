import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoMeterGroup } from '@dynamong/meter-group';
import type { DynamoMeterItem } from '@dynamong/meter-group';
import { DocPageShell } from '../components/doc-page-shell';

const STORAGE: DynamoMeterItem[] = [
  { label: 'Documents', value: 22, severity: 'primary' },
  { label: 'Photos', value: 31, severity: 'info' },
  { label: 'Videos', value: 18, severity: 'warning' },
  { label: 'Apps', value: 9, severity: 'success' },
];

@Component({
  selector: 'docs-meter-group-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMeterGroup, DocPageShell],
  template: `
    <docs-page-shell
      name="MeterGroup"
      description="A multi-segment labelled meter bar with a legend — for showing a breakdown like disk usage or a budget split. The multi-value sibling of Progress."
    >
      <div demo class="max-w-md space-y-6">
        <dg-meter-group [value]="storage" ariaLabel="Storage breakdown" />
        <dg-meter-group [value]="storage" orientation="vertical" [showLegend]="true" />
      </div>
      <div code>&lt;dg-meter-group [value]="storage" ariaLabel="Storage" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">DynamoMeterItem[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">max</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">100</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">orientation</td>
            <td class="py-2 pr-4 font-mono">'horizontal' | 'vertical'</td>
            <td class="py-2 font-mono">'horizontal'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showLegend</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        Each <code class="font-mono">DynamoMeterItem</code> is
        <code class="font-mono">{{ '{' }} label, value, severity?, color? {{ '}' }}</code>. Segments
        that would sum past <code class="font-mono">max</code> are scaled down proportionally so the
        bar never overflows.
      </p>
    </docs-page-shell>
  `,
})
export class MeterGroupDocPage {
  protected readonly storage = STORAGE;
}
