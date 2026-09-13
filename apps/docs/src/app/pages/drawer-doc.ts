import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDrawer } from '@dynamong/drawer';
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
  {
    name: 'position',
    type: "'left' | 'right' | 'top' | 'bottom'",
    default: "'right'",
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'title', type: 'string | undefined', default: 'undefined' },
  { name: 'closeOnEscape', type: 'boolean', default: 'true' },
  { name: 'closeOnBackdropClick', type: 'boolean', default: 'true' },
  { name: 'modal', type: 'boolean', default: 'true' },
  { name: 'blockScroll', type: 'boolean', default: 'false' },
  { name: 'closable', type: 'boolean', default: 'true' },
];

@Component({
  selector: 'docs-drawer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoDrawer,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Drawer"
      description="An off-canvas panel that slides in from a screen edge, with CDK-powered focus trapping and Escape/backdrop-to-close."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind [(open)]; position picks the edge it slides from."
      >
        <div preview>
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
          &lt;dg-drawer [(open)]="isOpen" position="right" title="Filters"&gt;
          ... &lt;/dg-drawer&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="non-modal"
        title="Non-modal"
        description="modal: false renders no backdrop and leaves the rest of the page fully interactive around the panel — closeOnBackdropClick has no effect then."
      >
        <div preview>
          <dg-button (click)="nonModalOpen.set(true)">Open panel</dg-button>
          <dg-drawer
            [open]="nonModalOpen()"
            (openChange)="nonModalOpen.set($event)"
            [modal]="false"
            position="right"
            title="Notifications"
          >
            <p class="text-text-primary">
              You can still interact with the rest of the page while this is
              open.
            </p>
          </dg-drawer>
        </div>
        <div code>
          &lt;dg-drawer [(open)]="isOpen" [modal]="false"
          title="Notifications"&gt; ... &lt;/dg-drawer&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DrawerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly open = signal(false);
  protected readonly nonModalOpen = signal(false);
}
