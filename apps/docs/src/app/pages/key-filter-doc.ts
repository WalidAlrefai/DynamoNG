import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoKeyFilter } from '@dynamong/key-filter';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-key-filter-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoKeyFilter, DocPageShell],
  template: `
    <docs-page-shell
      name="KeyFilter"
      description="dgKeyFilter — restricts what can be typed or pasted into an input to a preset (int, num, money, hex, alpha, alphanum, email) or a custom RegExp."
    >
      <div demo class="grid max-w-sm gap-3">
        <label class="grid gap-1 text-sm">
          <span class="text-text-muted">Integer</span>
          <input dgKeyFilter="int" class="rounded border border-border px-2 py-1" aria-label="Integer" />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="text-text-muted">Money (2 dp)</span>
          <input dgKeyFilter="money" class="rounded border border-border px-2 py-1" aria-label="Money" />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="text-text-muted">Hex</span>
          <input dgKeyFilter="hex" class="rounded border border-border px-2 py-1" aria-label="Hex" />
        </label>
        <label class="grid gap-1 text-sm">
          <span class="text-text-muted">Custom RegExp (a-c only)</span>
          <input [dgKeyFilter]="abc" class="rounded border border-border px-2 py-1" aria-label="Letters a to c" />
        </label>
      </div>
      <div code>&lt;input dgKeyFilter="money" /&gt;</div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-2 pr-4 font-mono">dgKeyFilter</td>
            <td class="py-2 pr-4 font-mono">
              'int' | 'pint' | 'num' | 'pnum' | 'money' | 'hex' | 'alpha' |
              'alphanum' | 'email' | RegExp
            </td>
            <td class="py-2 font-mono">required</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class KeyFilterDocPage {
  protected readonly abc = /^[a-c]*$/;
}
