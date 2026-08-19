import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAlert } from '@dynamong/alert';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-alert-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAlert, DocPageShell],
  template: `
    <docs-page-shell
      name="Alert"
      description="A persistent, severity-colored in-page status message, optionally closable."
    >
      <div demo class="flex flex-col gap-2">
        <dg-alert severity="info">This is an informational message.</dg-alert>
        <dg-alert severity="success" title="Success">
          Your changes have been saved.
        </dg-alert>
        <dg-alert severity="warning" [closable]="true">
          This one can be dismissed.
        </dg-alert>
      </div>
      <div code>
        &lt;dg-alert severity="success" title="Success"&gt;Your changes have
        been saved.&lt;/dg-alert&gt;
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
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">
              'primary' | 'secondary' | 'success' | 'info' | 'warning' |
              'danger'
            </td>
            <td class="py-2 font-mono">'info'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">title</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">closable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">visible</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">true</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class AlertDocPage {}
