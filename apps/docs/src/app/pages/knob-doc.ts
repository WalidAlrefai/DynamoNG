import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoKnob } from '@dynamong/knob';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'severity-size', title: 'Severity & Size' },
  { id: 'disabled', title: 'Disabled' },
];

@Component({
  selector: 'docs-knob-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoKnob, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Knob"
      description="A circular dial input adjustable by drag, scroll, or keyboard."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind the value with [(value)]; the number is drawn in the centre."
      >
        <div preview class="flex flex-col items-center gap-2">
          <dg-knob [(value)]="volume" ariaLabel="Volume" />
          <span class="text-sm text-text-muted">Volume: {{ volume() }}</span>
        </div>
        <div code>&lt;dg-knob [(value)]="volume" ariaLabel="Volume" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="severity-size"
        title="Severity & Size"
        description="severity recolors the arc; diameter sets the dial size in pixels."
      >
        <div preview>
          <dg-knob
            [value]="70"
            severity="success"
            [diameter]="80"
            ariaLabel="Brightness"
          />
        </div>
        <div code>
          &lt;dg-knob [value]="70" severity="success" [diameter]="80" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled blocks drag, scroll, and keyboard adjustment."
      >
        <div preview>
          <dg-knob [value]="40" [disabled]="true" ariaLabel="Disabled" />
        </div>
        <div code>&lt;dg-knob [value]="40" [disabled]="true" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">0</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">min / max / step</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">0 / 100 / 1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">diameter / strokeWidth</td>
            <td class="py-2 pr-4 font-mono">number (px)</td>
            <td class="py-2 font-mono">100 / 8</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showValue</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">
              'primary' | 'secondary' | 'success' | 'info' | 'warning' |
              'danger'
            </td>
            <td class="py-2 font-mono">'primary'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('Knob')</td>
          </tr>
        </tbody>
      </table>
    </docs-examples-layout>
  `,
})
export class KnobDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly volume = signal(50);
}
