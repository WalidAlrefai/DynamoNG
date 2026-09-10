import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoToolbar } from '@dynamong/toolbar';
import { DynamoButton } from '@dynamong/button';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-toolbar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoToolbar, DynamoButton, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Toolbar"
      description="An action bar with start/center/end content-projection slots."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Project [start], [center], and [end] content; the three slots space out across the bar."
      >
        <div preview class="w-full rounded-md border border-border p-2">
          <dg-toolbar ariaLabel="Document actions">
            <span start class="font-semibold">My Document</span>
            <span center class="text-sm text-text-muted">Autosaved</span>
            <div end class="flex gap-2">
              <dg-button size="sm" variant="outline">Share</dg-button>
              <dg-button size="sm">Save</dg-button>
            </div>
          </dg-toolbar>
        </div>
        <div code>
          &lt;dg-toolbar ariaLabel="Document actions"&gt; &lt;span start&gt;My
          Document&lt;/span&gt; &lt;span center&gt;Autosaved&lt;/span&gt;
          &lt;dg-button end&gt;Save&lt;/dg-button&gt; &lt;/dg-toolbar&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ToolbarDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
