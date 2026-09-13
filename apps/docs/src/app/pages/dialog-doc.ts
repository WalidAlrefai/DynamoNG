import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDialog } from '@dynamong/dialog';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'non-modal', title: 'Non-modal' },
];

const API: ApiTableRow[] = [
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'title', type: 'string | undefined', default: 'undefined' },
  { name: 'closeOnEscape', type: 'boolean', default: 'true' },
  { name: 'closeOnBackdropClick', type: 'boolean', default: 'true' },
  { name: 'modal', type: 'boolean', default: 'true' },
  { name: 'blockScroll', type: 'boolean', default: 'false' },
  { name: 'closable', type: 'boolean', default: 'true' },
];

@Component({
  selector: 'docs-dialog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoDialog,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
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

      <docs-example
        exampleId="non-modal"
        title="Non-modal"
        description="modal: false renders no backdrop and leaves the rest of the page fully interactive around the panel — closeOnBackdropClick has no effect then."
      >
        <div preview>
          <dg-button (click)="nonModalOpen.set(true)">Open panel</dg-button>
          <dg-dialog
            [open]="nonModalOpen()"
            (openChange)="nonModalOpen.set($event)"
            [modal]="false"
            title="Notifications"
          >
            <p class="text-text-primary">
              You can still interact with the rest of the page while this is
              open.
            </p>
          </dg-dialog>
        </div>
        <div code>
          &lt;dg-dialog [(open)]="isOpen" [modal]="false"
          title="Notifications"&gt; ... &lt;/dg-dialog&gt;
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
  protected readonly nonModalOpen = signal(false);
}
