import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTab, DynamoTabs } from '@dynamong/tabs';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-tabs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTabs, DynamoTab, DocPageShell],
  template: `
    <docs-page-shell
      name="Tabs"
      description="A tabbed content switcher with full keyboard navigation and ARIA tabs semantics."
    >
      <div demo>
        <dg-tabs [(value)]="activeTab">
          <dg-tab value="profile" label="Profile">
            <p class="text-text-primary">
              Manage your personal profile details here.
            </p>
          </dg-tab>
          <dg-tab value="settings" label="Settings">
            <p class="text-text-primary">
              Configure application preferences here.
            </p>
          </dg-tab>
          <dg-tab value="billing" label="Billing" [disabled]="true">
            <p class="text-text-primary">
              Billing is not available on this plan.
            </p>
          </dg-tab>
        </dg-tabs>
      </div>
      <div code>
        &lt;dg-tabs [(value)]="active"&gt; &lt;dg-tab value="profile"
        label="Profile"&gt;...&lt;/dg-tab&gt; &lt;/dg-tabs&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Element</th>
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-tabs</td>
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">string | undefined (model)</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-tabs</td>
            <td class="py-2 pr-4 font-mono">activation</td>
            <td class="py-2 pr-4 font-mono">'manual' | 'automatic'</td>
            <td class="py-2 font-mono">'manual'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-tabs</td>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-tab</td>
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-tab</td>
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">dg-tab</td>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class TabsDocPage {
  protected readonly activeTab = signal<string | undefined>('profile');
}
