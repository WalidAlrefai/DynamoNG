import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoToggleButton } from '@dynamong/toggle-button';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-toggle-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoToggleButton, DocPageShell],
  template: `
    <docs-page-shell
      name="Toggle Button"
      description="A single pressable button with a pressed/unpressed visual state."
    >
      <div demo class="flex flex-wrap items-center gap-2">
        <dg-toggle-button [(pressed)]="bold">Bold</dg-toggle-button>
        <dg-toggle-button [(pressed)]="italic">Italic</dg-toggle-button>
        <dg-toggle-button severity="danger" [(pressed)]="muted"
          >Mute</dg-toggle-button
        >
        <dg-toggle-button [disabled]="true">Disabled</dg-toggle-button>
      </div>
      <div code>
        &lt;dg-toggle-button [(pressed)]="bold"&gt;Bold&lt;/dg-toggle-button&gt;
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
            <td class="py-2 pr-4 font-mono">pressed</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">DynamoSeverity</td>
            <td class="py-2 font-mono">'primary'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">—</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ToggleButtonDocPage {
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly muted = signal(false);
}
