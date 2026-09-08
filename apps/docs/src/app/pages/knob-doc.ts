import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoKnob } from '@dynamong/knob';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-knob-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoKnob, DocPageShell],
  template: `
    <docs-page-shell
      name="Knob"
      description="A circular dial input adjustable by drag, scroll, or keyboard."
    >
      <div demo class="flex flex-wrap items-center gap-8">
        <div class="flex flex-col items-center gap-2">
          <dg-knob [(value)]="volume" ariaLabel="Volume" />
          <span class="text-sm text-text-muted">Volume: {{ volume() }}</span>
        </div>
        <dg-knob
          [value]="70"
          severity="success"
          [diameter]="80"
          ariaLabel="Brightness"
        />
        <dg-knob [value]="40" [disabled]="true" ariaLabel="Disabled" />
      </div>
      <div code>&lt;dg-knob [(value)]="volume" ariaLabel="Volume" /&gt;</div>
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
    </docs-page-shell>
  `,
})
export class KnobDocPage {
  protected readonly volume = signal(50);
}
