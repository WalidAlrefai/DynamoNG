import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoInputNumber } from '@dynamong/input-number';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-input-number-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoInputNumber, ReactiveFormsModule, DocPageShell],
  template: `
    <docs-page-shell
      name="Input Number"
      description="A numeric spinner input with increment/decrement buttons, keyboard stepping, and min/max/step bounds."
    >
      <div demo class="max-w-xs">
        <dg-input-number [formControl]="quantity" [min]="0" [max]="10" ariaLabel="Quantity" />
        <p class="mt-2 text-sm text-text-muted">
          Value: <span class="font-mono">{{ quantity.value ?? '(none)' }}</span>
        </p>
      </div>
      <div code>&lt;dg-input-number [formControl]="quantity" [min]="0" [max]="10" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">min</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">max</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">step</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
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
export class InputNumberDocPage {
  protected readonly quantity = new FormControl<number | null>(3);
}
