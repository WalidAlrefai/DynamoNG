import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAlert } from '@dynamong/alert';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'severities', title: 'Severities' },
  { id: 'closable', title: 'Closable' },
];

const API: ApiTableRow[] = [
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'",
    default: "'info'",
  },
  { name: 'title', type: 'string | undefined', default: 'undefined' },
  { name: 'closable', type: 'boolean', default: 'false' },
  { name: 'visible', type: 'boolean (model)', default: 'true' },
];

@Component({
  selector: 'docs-alert-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAlert, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Alert"
      description="A persistent, severity-colored in-page status message, optionally closable."
      [examples]="examples"
    >
      <docs-example
        exampleId="severities"
        title="Severities"
        description="severity sets the color and icon; an optional title renders above the message."
      >
        <div preview class="flex flex-col gap-2">
          <dg-alert severity="info">This is an informational message.</dg-alert>
          <dg-alert severity="success" title="Success">
            Your changes have been saved.
          </dg-alert>
          <dg-alert severity="danger" title="Error">
            Something went wrong.
          </dg-alert>
        </div>
        <div code>
          &lt;dg-alert severity="success" title="Success"&gt;Your changes have
          been saved.&lt;/dg-alert&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="closable"
        title="Closable"
        description="closable adds a dismiss button; two-way bind [(visible)] to control it."
      >
        <div preview>
          <dg-alert severity="warning" [closable]="true">
            This one can be dismissed.
          </dg-alert>
        </div>
        <div code>
          &lt;dg-alert severity="warning" [closable]="true"&gt;…&lt;/dg-alert&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class AlertDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
