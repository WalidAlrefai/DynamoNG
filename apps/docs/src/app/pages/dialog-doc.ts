import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDialog } from '@dynamong/dialog';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'title', type: 'string | undefined', default: 'undefined' },
  { name: 'closeOnEscape', type: 'boolean', default: 'true' },
];

@Component({
  selector: 'docs-dialog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoDialog, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Dialog"
      description="A modal dialog with CDK-powered focus trapping and Escape/backdrop-to-close."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind [(open)]; the dialog traps focus while open and restores it on close."
      >
        <div preview>
          <dg-button (click)="open.set(true)">Open dialog</dg-button>
          <dg-dialog
            [open]="open()"
            (openChange)="open.set($event)"
            title="Delete item"
          >
            <p class="text-text-primary">
              Are you sure you want to delete this item? This cannot be undone.
            </p>
            <div class="mt-4 flex justify-end gap-2">
              <dg-button variant="text" (click)="open.set(false)">
                Cancel
              </dg-button>
              <dg-button severity="danger" (click)="open.set(false)">
                Delete
              </dg-button>
            </div>
          </dg-dialog>
        </div>
        <div code>
          &lt;dg-dialog [(open)]="isOpen" title="Delete item"&gt; ...
          &lt;/dg-dialog&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DialogDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly open = signal(false);
}
