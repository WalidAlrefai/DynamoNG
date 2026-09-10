import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoColorPicker } from '@dynamong/color-picker';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'disabled', title: 'Disabled' },
];

@Component({
  selector: 'docs-color-picker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoColorPicker, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Color Picker"
      description="A color input with a hex field, preset swatches, and a native color picker."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind a hex string with [(value)]. Includes preset swatches and the native picker."
      >
        <div preview class="max-w-xs">
          <dg-color-picker [(value)]="color" ariaLabel="Brand color" />
          <p class="mt-2 text-sm text-text-muted">
            Value: <span class="font-mono">{{ color() || '(none)' }}</span>
          </p>
        </div>
        <div code>&lt;dg-color-picker [(value)]="color" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled blocks the hex field, swatches, and native picker."
      >
        <div preview class="max-w-xs">
          <dg-color-picker
            [value]="'#3b82f6'"
            [disabled]="true"
            ariaLabel="Disabled"
          />
        </div>
        <div code>&lt;dg-color-picker [value]="'#3b82f6'" [disabled]="true" /&gt;</div>
      </docs-example>

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
            <td class="py-2 pr-4 font-mono">string (model)</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">swatches</td>
            <td class="py-2 pr-4 font-mono">string[]</td>
            <td class="py-2 font-mono">10 preset colors</td>
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
    </docs-examples-layout>
  `,
})
export class ColorPickerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly color = signal('#3b82f6');
}
