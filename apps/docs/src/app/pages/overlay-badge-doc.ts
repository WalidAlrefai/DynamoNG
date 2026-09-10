import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAvatar } from '@dynamong/avatar';
import { DynamoButton } from '@dynamong/button';
import { DynamoOverlayBadge } from '@dynamong/overlay-badge';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'count', title: 'Count' },
  { id: 'dot', title: 'Dot' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'string | number | undefined', default: 'undefined' },
  { name: 'dot', type: 'boolean', default: 'false' },
  { name: 'max', type: 'number | undefined', default: 'undefined' },
  { name: 'severity', type: 'DynamoSeverity', default: "'danger'" },
  {
    name: 'position',
    type: "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'",
    default: "'top-right'",
  },
];

@Component({
  selector: 'docs-overlay-badge-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoOverlayBadge,
    DynamoAvatar,
    DynamoButton,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="OverlayBadge"
      description="A wrapper that overlays a small badge (a count) or a dot on any element — an unread indicator on an avatar or icon button."
      [examples]="examples"
    >
      <docs-example
        exampleId="count"
        title="Count"
        description="value shows a number; max collapses larger counts to “N+”."
      >
        <div preview class="flex items-center gap-8 py-4">
          <dg-overlay-badge [value]="3" aria-label="Messages, 3 unread">
            <dg-avatar name="Ada Lovelace" />
          </dg-overlay-badge>
          <dg-overlay-badge [value]="128" [max]="99">
            <dg-button variant="outline">Inbox</dg-button>
          </dg-overlay-badge>
        </div>
        <div code>
          &lt;dg-overlay-badge [value]="3"&gt; &lt;dg-avatar name="Ada" /&gt;
          &lt;/dg-overlay-badge&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="dot"
        title="Dot"
        description="dot renders a small marker with no number; position picks the corner."
      >
        <div preview class="py-4">
          <dg-overlay-badge
            [dot]="true"
            severity="success"
            position="bottom-right"
          >
            <dg-avatar name="Grace Hopper" />
          </dg-overlay-badge>
        </div>
        <div code>
          &lt;dg-overlay-badge [dot]="true" severity="success"
          position="bottom-right"&gt; … &lt;/dg-overlay-badge&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          The marker is decorative
          (<code class="font-mono">aria-hidden</code>). Give the wrapped control
          its own accessible name that includes the count, e.g.
          <code class="font-mono">aria-label="Messages, 3 unread"</code>.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class OverlayBadgeDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
