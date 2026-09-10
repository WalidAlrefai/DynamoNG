import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoDrawer } from '@dynamong/drawer';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

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
];

@Component({
  selector: 'docs-drawer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoDrawer, DocExamplesLayout, DocExample, DocApiTable],
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

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DrawerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly open = signal(false);
}
