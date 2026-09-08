import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoPanel } from '@dynamong/panel';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-panel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPanel, DocPageShell],
  template: `
    <docs-page-shell
      name="Panel"
      description="A single standalone collapsible content section with its own header — the gap between Card (no collapse) and Accordion (coordinates multiple panels)."
    >
      <div demo class="flex max-w-md flex-col gap-4">
        <dg-panel header="Shipping details" [collapsible]="true">
          <p class="text-text-primary">Orders ship within 2 business days.</p>
        </dg-panel>
        <dg-panel header="Static panel" variant="outlined">
          <p class="text-text-primary">Not collapsible — always expanded.</p>
        </dg-panel>
      </div>
      <div code>
        &lt;dg-panel header="Shipping details" [collapsible]="true"&gt;
        ...&lt;/dg-panel&gt;
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
            <td class="py-2 pr-4 font-mono">header</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">variant</td>
            <td class="py-2 pr-4 font-mono">'elevated' | 'outlined' | 'filled'</td>
            <td class="py-2 font-mono">'elevated'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">collapsible</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">collapsed</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class PanelDocPage {}
