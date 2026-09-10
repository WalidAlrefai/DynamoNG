import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoKeyFilter } from '@dynamong/key-filter';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'presets', title: 'Presets' },
  { id: 'custom', title: 'Custom RegExp' },
];

@Component({
  selector: 'docs-key-filter-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoKeyFilter, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="KeyFilter"
      description="dgKeyFilter — restricts what can be typed or pasted into an input to a preset (int, num, money, hex, alpha, alphanum, email) or a custom RegExp."
      [examples]="examples"
    >
      <docs-example
        exampleId="presets"
        title="Presets"
        description="Pass a preset name as a string — int, pint, num, pnum, money, hex, alpha, alphanum, or email."
      >
        <div preview class="grid max-w-sm gap-3">
          <label class="grid gap-1 text-sm">
            <span class="text-text-muted">Integer</span>
            <input
              dgKeyFilter="int"
              class="rounded border border-border px-2 py-1"
              aria-label="Integer"
            />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-text-muted">Money (2 dp)</span>
            <input
              dgKeyFilter="money"
              class="rounded border border-border px-2 py-1"
              aria-label="Money"
            />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-text-muted">Hex</span>
            <input
              dgKeyFilter="hex"
              class="rounded border border-border px-2 py-1"
              aria-label="Hex"
            />
          </label>
        </div>
        <div code>&lt;input dgKeyFilter="money" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="custom"
        title="Custom RegExp"
        description="Bind a RegExp for full control — the pattern is tested against the would-be resulting value."
      >
        <div preview class="max-w-sm">
          <input
            [dgKeyFilter]="abc"
            class="rounded border border-border px-2 py-1"
            aria-label="Letters a to c"
            placeholder="a–c only"
          />
        </div>
        <div code>
          abc = /^[a-c]*$/; &lt;input [dgKeyFilter]="abc" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
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
      </div>
    </docs-examples-layout>
  `,
})
export class KeyFilterDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly abc = /^[a-c]*$/;
}
