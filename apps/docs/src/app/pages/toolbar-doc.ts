import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoToolbar } from '@dynamong/toolbar';
import { DynamoButton } from '@dynamong/button';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-toolbar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoToolbar, DynamoButton, DocPageShell],
  template: `
    <docs-page-shell
      name="Toolbar"
      description="An action bar with start/center/end content-projection slots."
    >
      <div demo class="w-full rounded-md border border-border p-2">
        <dg-toolbar ariaLabel="Document actions">
          <span start class="font-semibold">My Document</span>
          <span center class="text-sm text-text-muted">Autosaved</span>
          <div end class="flex gap-2">
            <dg-button size="sm" variant="outline">Share</dg-button>
            <dg-button size="sm">Save</dg-button>
          </div>
        </dg-toolbar>
      </div>
      <div code>&lt;dg-toolbar ariaLabel="Document actions"&gt;
  &lt;span start&gt;My Document&lt;/span&gt;
  &lt;span center&gt;Autosaved&lt;/span&gt;
  &lt;dg-button end&gt;Save&lt;/dg-button&gt;
&lt;/dg-toolbar&gt;</div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ToolbarDocPage {}
