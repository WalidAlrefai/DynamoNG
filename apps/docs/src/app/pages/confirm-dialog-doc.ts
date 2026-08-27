import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoConfirmService } from '@dynamong/confirm-dialog';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-confirm-dialog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DocPageShell],
  template: `
    <docs-page-shell
      name="Confirm Dialog"
      description="An imperative confirm-before-action prompt — no tag to place in your template, just inject and call."
    >
      <div demo class="flex flex-wrap items-center gap-2">
        <dg-button
          severity="danger"
          (click)="onDelete()"
          >Delete item</dg-button
        >
        @if (lastResult() !== null) {
          <span class="text-sm text-text-muted">
            Result: <code class="font-mono">{{ lastResult() }}</code>
          </span>
        }
      </div>
      <div code>
        constructor() &#123; this.confirm = inject(DynamoConfirmService); &#125;
        const confirmed = await this.confirm.open(&#123;
          title: 'Delete item',
          message: 'Are you sure? This cannot be undone.',
          severity: 'danger',
          confirmLabel: 'Delete',
        &#125;);
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Method</th>
            <th class="py-2 pr-4">Signature</th>
            <th class="py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">
              (options: DynamoConfirmOptions) =&gt; Promise&lt;boolean&gt;
            </td>
            <td class="py-2">
              Shows a confirm prompt. Resolves <code class="font-mono">true</code>
              on confirm, <code class="font-mono">false</code> on cancel/backdrop
              click/Escape. Queues if one is already showing.
            </td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">confirm</td>
            <td class="py-2 pr-4 font-mono">() =&gt; void</td>
            <td class="py-2">
              Confirms the currently-showing prompt, as if its confirm button
              were clicked.
            </td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">cancel</td>
            <td class="py-2 pr-4 font-mono">() =&gt; void</td>
            <td class="py-2">
              Cancels the currently-showing prompt, as if its cancel button
              were clicked.
            </td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">DynamoConfirmOptions</code>:
        <code class="font-mono">message</code> (required),
        <code class="font-mono">title?</code>,
        <code class="font-mono">confirmLabel?</code> (default
        <code class="font-mono">'Confirm'</code>),
        <code class="font-mono">cancelLabel?</code> (default
        <code class="font-mono">'Cancel'</code>),
        <code class="font-mono">severity?</code> (default
        <code class="font-mono">'primary'</code>),
        <code class="font-mono">closeOnBackdropClick?</code> (default
        <code class="font-mono">true</code>),
        <code class="font-mono">closeOnEscape?</code> (default
        <code class="font-mono">true</code>).
      </p>
    </docs-page-shell>
  `,
})
export class ConfirmDialogDocPage {
  protected readonly confirm = inject(DynamoConfirmService);
  protected readonly lastResult = signal<boolean | null>(null);

  protected onDelete(): void {
    this.confirm
      .open({
        title: 'Delete item',
        message: 'Are you sure? This cannot be undone.',
        severity: 'danger',
        confirmLabel: 'Delete',
      })
      .then((result) => this.lastResult.set(result));
  }
}
