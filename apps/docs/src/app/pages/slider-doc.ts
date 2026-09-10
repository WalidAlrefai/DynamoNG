import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSlider } from '@dynamong/slider';
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
  selector: 'docs-slider-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSlider, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Slider"
      description="A draggable range input with keyboard stepping and click-to-jump."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind the value with [(value)]; defaults to a 0–100 range."
        [code]="basicCode"
      >
        <div preview class="flex flex-col gap-2">
          <span class="text-sm text-text-muted">Volume: {{ volume() }}</span>
          <dg-slider [(value)]="volume" ariaLabel="Volume" />
        </div>
      </docs-example>

      <docs-example
        exampleId="severity-size"
        title="Severity & Size"
        description="severity recolors the track/thumb; size sets the track thickness."
        [code]="severitySizeCode"
      >
        <div preview>
          <dg-slider
            [value]="70"
            severity="success"
            size="lg"
            ariaLabel="Brightness"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled blocks drag, click, and keyboard interaction."
        [code]="disabledCode"
      >
        <div preview>
          <dg-slider [value]="40" [disabled]="true" ariaLabel="Disabled" />
        </div>
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
            <td class="py-2 font-mono">undefined ('Slider')</td>
          </tr>
        </tbody>
      </table>
    </docs-examples-layout>
  `,
})
export class SliderDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly volume = signal(50);

  protected readonly basicCode = `<dg-slider [(value)]="volume" ariaLabel="Volume" />`;
  protected readonly severitySizeCode = `<dg-slider [value]="70" severity="success" size="lg" ariaLabel="Brightness" />`;
  protected readonly disabledCode = `<dg-slider [value]="40" [disabled]="true" ariaLabel="Disabled" />`;
}
