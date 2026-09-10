import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSplitter, DynamoSplitterPanel } from '@dynamong/splitter';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
  },
  { name: 'gutterSize', type: 'number (px)', default: '8' },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'panel.initialSize', type: 'number (%)', default: 'even split' },
  { name: 'panel.minSize', type: 'number (%)', default: '0' },
];

@Component({
  selector: 'docs-splitter-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoSplitter,
    DynamoSplitterPanel,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Splitter"
      description="A resizable multi-pane layout container with draggable dividers."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Each <dg-splitter-panel> takes an initialSize (%) and a minSize; drag the gutters to resize."
      >
        <div preview class="h-64 rounded-md border border-border">
          <dg-splitter styleClass="h-full">
            <dg-splitter-panel [initialSize]="25" [minSize]="10">
              <div
                class="flex h-full items-center justify-center bg-surface-100 p-4"
              >
                Sidebar
              </div>
            </dg-splitter-panel>
            <dg-splitter-panel [minSize]="20">
              <div
                class="flex h-full items-center justify-center bg-surface-0 p-4"
              >
                Main content
              </div>
            </dg-splitter-panel>
            <dg-splitter-panel [initialSize]="25" [minSize]="10">
              <div
                class="flex h-full items-center justify-center bg-surface-100 p-4"
              >
                Details
              </div>
            </dg-splitter-panel>
          </dg-splitter>
        </div>
        <div code>
          &lt;dg-splitter&gt; &lt;dg-splitter-panel
          [initialSize]="25"&gt;Sidebar&lt;/dg-splitter-panel&gt;
          &lt;dg-splitter-panel&gt;Main&lt;/dg-splitter-panel&gt;
          &lt;/dg-splitter&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SplitterDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
