import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DocPageShell],
  template: `
    <docs-page-shell
      name="Button"
      description="Triggers an action. Supports severity, size, variant, and a loading state."
    >
      <div demo class="flex flex-wrap gap-2">
        <dg-button severity="primary">Primary</dg-button>
        <dg-button severity="danger" variant="outline">Danger outline</dg-button>
        <dg-button severity="success" variant="text">Success text</dg-button>
        <dg-button [loading]="true">Loading</dg-button>
        <dg-button [disabled]="true">Disabled</dg-button>
      </div>
      <div code>&lt;dg-button severity="primary" variant="solid" size="md"&gt;Save&lt;/dg-button&gt;</div>
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
            <td class="py-2 pr-4 font-mono">variant</td>
            <td class="py-2 pr-4 font-mono">'solid' | 'outline' | 'text'</td>
            <td class="py-2 font-mono">'solid'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">loading</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ButtonDocPage {}
