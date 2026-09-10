import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoFocusTrap } from '@dynamong/focus-trap';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-focus-trap-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoFocusTrap, DynamoButton, DocPageShell],
  template: `
    <docs-page-shell
      name="FocusTrap"
      description="dgFocusTrap — keeps Tab / Shift+Tab focus cycling within the host element while enabled. Wraps the shared DynamoFocusTrapService."
    >
      <div demo class="space-y-3">
        <dg-button variant="outline" (click)="on.set(!on())">
          {{ on() ? 'Release trap' : 'Activate trap' }}
        </dg-button>
        <div
          [dgFocusTrap]="on()"
          class="flex gap-2 rounded-md border border-border p-4"
          [class.ring-2]="on()"
          [class.ring-ring]="on()"
        >
          <input class="rounded border border-border px-2 py-1" placeholder="One" aria-label="One" />
          <input class="rounded border border-border px-2 py-1" placeholder="Two" aria-label="Two" />
          <button type="button" class="rounded border border-border px-3 py-1">Three</button>
        </div>
        <p class="text-sm text-text-muted">
          While active, Tab past the last field wraps to the first and never leaves the box.
        </p>
      </div>
      <div code>&lt;div [dgFocusTrap]="isOpen()"&gt; ... &lt;/div&gt;</div>
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
            <td class="py-2 pr-4 font-mono">dgFocusTrap</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class FocusTrapDocPage {
  protected readonly on = signal(false);
}
