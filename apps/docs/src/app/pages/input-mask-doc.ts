import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoInputMask } from '@dynamong/input-mask';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-input-mask-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoInputMask, ReactiveFormsModule, DocPageShell],
  template: `
    <docs-page-shell
      name="Input Mask"
      description="A masked text input that enforces a fixed character pattern as the user types — literal characters auto-insert, backspace/delete correctly skip over them, and paste re-applies the mask."
    >
      <div demo class="flex flex-col gap-6">
        <div class="max-w-xs">
          <dg-input-mask [formControl]="phone" mask="(999) 999-9999" ariaLabel="Phone number" placeholder="(555) 000-0000" />
          <p class="mt-2 text-sm text-text-muted">
            Value: <span class="font-mono">{{ phone.value || '(none)' }}</span>
          </p>
        </div>
        <div class="max-w-xs">
          <dg-input-mask [formControl]="date" mask="99/99/9999" ariaLabel="Date" placeholder="MM/DD/YYYY" />
          <p class="mt-2 text-sm text-text-muted">
            Value: <span class="font-mono">{{ date.value || '(none)' }}</span>
          </p>
        </div>
      </div>
      <div code>&lt;dg-input-mask [formControl]="phone" mask="(999) 999-9999" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">mask</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">required</td>
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
            <td class="py-2 pr-4 font-mono">invalid</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class InputMaskDocPage {
  protected readonly phone = new FormControl<string | null>(null);
  protected readonly date = new FormControl<string | null>(null);
}
