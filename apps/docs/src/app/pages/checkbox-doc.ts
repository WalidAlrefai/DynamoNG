import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-checkbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCheckbox, DocPageShell],
  template: `
    <docs-page-shell
      name="Checkbox"
      description="A tri-state (checked / unchecked / indeterminate) toggle control."
    >
      <div demo class="flex flex-col gap-3">
        <dg-checkbox [checked]="true">Accept terms and conditions</dg-checkbox>
        <dg-checkbox [indeterminate]="true">Select all (partially selected)</dg-checkbox>
        <dg-checkbox [disabled]="true">Disabled option</dg-checkbox>
      </div>
      <div code>&lt;dg-checkbox [(checked)]="accepted"&gt;Accept terms and conditions&lt;/dg-checkbox&gt;</div>
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
            <td class="py-2 pr-4 font-mono">checked</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">indeterminate</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class CheckboxDocPage {}
