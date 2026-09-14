import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoPanel } from '@dynamong/panel';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'collapsible', title: 'Collapsible' },
  { id: 'static', title: 'Static' },
  { id: 'footer', title: 'With Footer' },
];

const API: ApiTableRow[] = [
  { name: 'header', type: 'string', default: "''" },
  {
    name: 'variant',
    type: "'elevated' | 'outlined' | 'filled'",
    default: "'elevated'",
  },
  { name: 'collapsible', type: 'boolean', default: 'false' },
  { name: 'collapsed', type: 'boolean (model)', default: 'false' },
  { name: 'showHeader', type: 'boolean', default: 'true' },
];

@Component({
  selector: 'docs-panel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoPanel,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Panel"
      description="A single standalone collapsible content section with its own header — the gap between Card (no collapse) and Accordion (coordinates multiple panels)."
      [examples]="examples"
    >
      <docs-example
        exampleId="collapsible"
        title="Collapsible"
        description="collapsible adds a toggle to the header; two-way bind [(collapsed)]."
      >
        <div preview class="max-w-md">
          <dg-panel header="Shipping details" [collapsible]="true">
            <p class="text-text-primary">Orders ship within 2 business days.</p>
          </dg-panel>
        </div>
        <div code>
          &lt;dg-panel header="Shipping details" [collapsible]="true"&gt; ...
          &lt;/dg-panel&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="static"
        title="Static"
        description="Without collapsible it's an always-expanded titled section; variant sets the surface treatment."
      >
        <div preview class="max-w-md">
          <dg-panel header="Static panel" variant="outlined">
            <p class="text-text-primary">Not collapsible — always expanded.</p>
          </dg-panel>
        </div>
        <div code>
          &lt;dg-panel header="Static panel" variant="outlined"&gt; ...
          &lt;/dg-panel&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="footer"
        title="With Footer"
        description="Project a [footer] slot for actions below the body, same convention as Card."
      >
        <div preview class="max-w-md">
          <dg-panel header="Outlined" variant="outlined">
            <p class="text-text-primary">Panel body content.</p>
            <div footer>
              <dg-button size="sm">Action</dg-button>
            </div>
          </dg-panel>
        </div>
        <div code>
          &lt;dg-panel header="Title"&gt; Body &lt;div footer&gt;&lt;dg-button
          size="sm"&gt;Action&lt;/dg-button&gt;&lt;/div&gt; &lt;/dg-panel&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class PanelDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
