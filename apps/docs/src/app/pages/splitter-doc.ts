import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSplitter, DynamoSplitterPanel } from '@dynamong/splitter';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'resize-end', title: 'Resize End' },
];

const API: ApiTableRow[] = [
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
  },
  { name: 'gutterSize', type: 'number (px)', default: '8' },
  { name: 'step', type: 'number (%)', default: '5' },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'panel.initialSize', type: 'number (%)', default: 'even split' },
  { name: 'panel.minSize', type: 'number (%)', default: '0' },
  { name: 'resizeEnd (output)', type: 'number[]', default: '—' },
];

@Component({
  selector: 'docs-splitter-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
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

      <docs-example
        exampleId="resize-end"
        title="Resize End"
        description="resizeEnd fires with the full sizes array once a drag or keyboard resize completes — useful for persisting the layout yourself."
      >
        <div preview class="space-y-2">
          <div class="h-32 rounded-md border border-border">
            <dg-splitter
              styleClass="h-full"
              (resizeEnd)="lastSizes.set($event)"
            >
              <dg-splitter-panel [minSize]="10">
                <div
                  class="flex h-full items-center justify-center bg-surface-100 p-4"
                >
                  A
                </div>
              </dg-splitter-panel>
              <dg-splitter-panel [minSize]="10">
                <div
                  class="flex h-full items-center justify-center bg-surface-0 p-4"
                >
                  B
                </div>
              </dg-splitter-panel>
            </dg-splitter>
          </div>
          @if (lastSizes(); as sizes) {
            <p class="text-sm text-text-muted">
              Last sizes:
              <span class="font-mono"
                >{{ sizes[0] | number: '1.0-1' }}% /
                {{ sizes[1] | number: '1.0-1' }}%</span
              >
            </p>
          }
        </div>
        <div code>
          &lt;dg-splitter (resizeEnd)="onResizeEnd($event)"&gt; ...
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
  protected readonly lastSizes = signal<number[] | null>(null);
}
