import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDialog } from '@dynamong/dialog';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-dialog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoDialog, DocPageShell],
  template: `
    <docs-page-shell
      name="Dialog"
      description="A modal dialog with CDK-powered focus trapping and Escape/backdrop-to-close."
    >
      <div demo>
        <dg-button (click)="open.set(true)">Open dialog</dg-button>
        <dg-dialog [open]="open()" (openChange)="open.set($event)" title="Delete item">
          <p class="text-text-primary">Are you sure you want to delete this item? This cannot be undone.</p>
          <div class="mt-4 flex justify-end gap-2">
            <dg-button variant="text" (click)="open.set(false)">Cancel</dg-button>
            <dg-button severity="danger" (click)="open.set(false)">Delete</dg-button>
          </div>
        </dg-dialog>
      </div>
      <div code>&lt;dg-dialog [(open)]="isOpen" title="Delete item"&gt;...&lt;/dg-dialog&gt;</div>
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
export class DialogDocPage {
  protected readonly open = signal(false);
}
