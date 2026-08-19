import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoChip } from '@dynamong/chip';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-chip-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoChip, DocPageShell],
  template: `
    <docs-page-shell
      name="Chip"
      description="A compact, optionally-removable label."
    >
      <div demo class="flex flex-wrap items-center gap-2">
        <dg-chip severity="primary">Primary</dg-chip>
        <dg-chip severity="success" variant="outline">Outline</dg-chip>
        <dg-chip severity="secondary" [removable]="true">Removable</dg-chip>
      </div>
      <div code>
        &lt;dg-chip severity="secondary" [removable]="true"
        (removed)="onRemove()"&gt;Frontend&lt;/dg-chip&gt;
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
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">
              'primary' | 'secondary' | 'success' | 'info' | 'warning' |
              'danger'
            </td>
            <td class="py-2 font-mono">'primary'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">variant</td>
            <td class="py-2 pr-4 font-mono">'solid' | 'outline'</td>
            <td class="py-2 font-mono">'solid'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">removable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">removeAriaLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Remove'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ChipDocPage {}
