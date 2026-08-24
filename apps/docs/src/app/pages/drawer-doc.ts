import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDrawer } from '@dynamong/drawer';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-drawer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoDrawer, DocPageShell],
  template: `
    <docs-page-shell
      name="Drawer"
      description="An off-canvas panel that slides in from a screen edge, with CDK-powered focus trapping and Escape/backdrop-to-close."
    >
      <div demo>
        <dg-button (click)="open.set(true)">Open drawer</dg-button>
        <dg-drawer
          [open]="open()"
          (openChange)="open.set($event)"
          position="right"
          title="Filters"
        >
          <p class="text-text-primary">Filter controls go here.</p>
          <div class="mt-4 flex justify-end">
            <dg-button (click)="open.set(false)">Apply</dg-button>
          </div>
        </dg-drawer>
      </div>
      <div code>
        &lt;dg-drawer [(open)]="isOpen" position="right"
        title="Filters"&gt;...&lt;/dg-drawer&gt;
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
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">
              'left' | 'right' | 'top' | 'bottom'
            </td>
            <td class="py-2 font-mono">'right'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">title</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">closeOnEscape</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class DrawerDocPage {
  protected readonly open = signal(false);
}
