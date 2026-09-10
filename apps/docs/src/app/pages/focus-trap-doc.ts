import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoFocusTrap } from '@dynamong/focus-trap';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'dgFocusTrap', type: 'boolean', default: 'true' },
];

@Component({
  selector: 'docs-focus-trap-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoFocusTrap,
    DynamoButton,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="FocusTrap"
      description="dgFocusTrap — keeps Tab / Shift+Tab focus cycling within the host element while enabled. Wraps the shared DynamoFocusTrapService."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a boolean to [dgFocusTrap]. While true, Tab past the last focusable descendant wraps to the first and never leaves the host."
      >
        <div preview class="space-y-3">
          <dg-button variant="outline" (click)="on.set(!on())">
            {{ on() ? 'Release trap' : 'Activate trap' }}
          </dg-button>
          <div
            [dgFocusTrap]="on()"
            class="flex gap-2 rounded-md border border-border p-4"
            [class.ring-2]="on()"
            [class.ring-ring]="on()"
          >
            <input
              class="rounded border border-border px-2 py-1"
              placeholder="One"
              aria-label="One"
            />
            <input
              class="rounded border border-border px-2 py-1"
              placeholder="Two"
              aria-label="Two"
            />
            <button
              type="button"
              class="rounded border border-border px-3 py-1"
            >
              Three
            </button>
          </div>
        </div>
        <div code>&lt;div [dgFocusTrap]="isOpen()"&gt; ... &lt;/div&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class FocusTrapDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly on = signal(false);
}
