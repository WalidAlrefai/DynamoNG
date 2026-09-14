import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoScrollPanel } from '@dynamong/scroll-panel';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'vertical', title: 'Vertical' },
  { id: 'both-axes', title: 'Both Axes' },
];

const ROWS = Array.from({ length: 20 }, (_, i) => `Row ${i + 1}`);
const COLUMNS = Array.from({ length: 12 }, (_, i) => `Column ${i + 1}`);

@Component({
  selector: 'docs-scroll-panel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoScrollPanel, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Scroll Panel"
      description="Wraps projected content in a themed, custom-styled scrollbar in place of the browser's native one — scrolling itself stays entirely native."
      [examples]="examples"
    >
      <docs-example
        exampleId="vertical"
        title="Vertical"
        description="Size the panel with styleClass; a thumb appears only for the axis that actually overflows."
      >
        <div preview class="w-64">
          <dg-scroll-panel
            styleClass="h-48 rounded-md border border-border p-3"
          >
            @for (row of rows; track row) {
              <p class="py-1 text-sm text-text-primary">{{ row }}</p>
            }
          </dg-scroll-panel>
        </div>
        <div code>
          &lt;dg-scroll-panel styleClass="h-48"&gt; ... &lt;/dg-scroll-panel&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="both-axes"
        title="Both Axes"
        description="Vertical and horizontal thumbs are fully independent — both can show at once when content overflows in both directions."
      >
        <div preview class="w-64">
          <dg-scroll-panel
            styleClass="h-48 rounded-md border border-border p-3"
          >
            <div class="grid w-[640px] grid-cols-12 gap-2">
              @for (column of columns; track column) {
                <div class="text-sm font-medium text-text-primary">
                  {{ column }}
                </div>
              }
              @for (row of rows; track row) {
                @for (column of columns; track column) {
                  <div class="text-sm text-text-muted">{{ row }}</div>
                }
              }
            </div>
          </dg-scroll-panel>
        </div>
        <div code>
          &lt;dg-scroll-panel styleClass="h-48"&gt; &lt;div
          class="w-[640px]"&gt;...&lt;/div&gt; &lt;/dg-scroll-panel&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <p class="text-sm text-text-muted">
          No component-specific inputs — only the inherited
          <code class="font-mono">styleClass</code>/<code class="font-mono"
            >pt</code
          >/<code class="font-mono">unstyled</code>. Size the panel with
          <code class="font-mono">styleClass</code> (e.g.
          <code class="font-mono">"h-48"</code>); a thumb for an axis renders
          only once that axis actually overflows.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class ScrollPanelDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly rows = ROWS;
  protected readonly columns = COLUMNS;
}
