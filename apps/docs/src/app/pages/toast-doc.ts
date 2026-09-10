import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoToastService } from '@dynamong/toast';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

@Component({
  selector: 'docs-toast-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Toast"
      description="A global, imperative notification service — no tag to place in your template, just inject and call."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Inject DynamoToastService and call success / info / warning / error with a message."
      >
        <div preview class="flex flex-wrap gap-2">
          <dg-button
            severity="success"
            (click)="toast.success('Changes saved successfully.')"
          >
            Success
          </dg-button>
          <dg-button
            severity="info"
            (click)="toast.info('A new version is available.')"
          >
            Info
          </dg-button>
          <dg-button
            severity="warning"
            (click)="toast.warning('Your session expires in 5 minutes.')"
          >
            Warning
          </dg-button>
          <dg-button
            severity="danger"
            (click)="toast.error('Could not save changes.')"
          >
            Error
          </dg-button>
        </div>
        <div code>
          private toast = inject(DynamoToastService);
          this.toast.success('Changes saved successfully.');
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-text-muted">
              <th class="py-2 pr-4">Method</th>
              <th class="py-2 pr-4">Signature</th>
              <th class="py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">show</td>
              <td class="py-2 pr-4 font-mono">
                (options: DynamoToastOptions) =&gt; string
              </td>
              <td class="py-2">
                Full control over severity/title/duration/position. Returns the
                new toast's id.
              </td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">
                success / info / warning / error
              </td>
              <td class="py-2 pr-4 font-mono">
                (message: string, options?) =&gt; string
              </td>
              <td class="py-2">
                Convenience wrappers over
                <code class="font-mono">show()</code> that fix the severity.
              </td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dismiss</td>
              <td class="py-2 pr-4 font-mono">(id: string) =&gt; void</td>
              <td class="py-2">Dismisses one toast by its id.</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">dismissAll</td>
              <td class="py-2 pr-4 font-mono">() =&gt; void</td>
              <td class="py-2">Dismisses every visible toast.</td>
            </tr>
          </tbody>
        </table>
        <p class="text-sm text-text-muted">
          <code class="font-mono">DynamoToastOptions</code>:
          <code class="font-mono">message</code> (required),
          <code class="font-mono">title?</code>,
          <code class="font-mono">severity?</code> (default
          <code class="font-mono">'info'</code>),
          <code class="font-mono">duration?</code> ms (0 disables auto-dismiss,
          default <code class="font-mono">5000</code>),
          <code class="font-mono">closable?</code> (default
          <code class="font-mono">true</code>),
          <code class="font-mono">position?</code> (default
          <code class="font-mono">'top-right'</code>).
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class ToastDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly toast = inject(DynamoToastService);
}
