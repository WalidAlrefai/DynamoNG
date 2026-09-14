import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { DynamoScrollPanel } from '@dynamong/scroll-panel';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'vertical', title: 'Vertical' },
  { id: 'both-axes', title: 'Both Axes' },
  { id: 'programmatic', title: 'Programmatic Scroll' },
];

const ROWS = Array.from({ length: 20 }, (_, i) => `Row ${i + 1}`);
const COLUMNS = Array.from({ length: 12 }, (_, i) => `Column ${i + 1}`);
const LONG_LIST = Array.from({ length: 60 }, (_, i) => `Item ${i + 1}`);

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
        description="Size the panel with styleClass; a thumb appears only for the axis that actually overflows. Notice the edge fade hint once you scroll past the top, and the invisible track behind the thumb pages one viewport-length per click."
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

      <docs-example
        exampleId="programmatic"
        title="Programmatic Scroll"
        description="On a 60-row list, the thumb clamps to a minimum grabbable size rather than shrinking further. Grab a reference to the panel (e.g. via viewChild) to scroll it from outside."
      >
        <div preview class="w-64 space-y-3">
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-sm text-text-primary hover:bg-surface-100"
              (click)="scrollToTop()"
            >
              Scroll to top
            </button>
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-sm text-text-primary hover:bg-surface-100"
              (click)="scrollToBottom()"
            >
              Scroll to bottom
            </button>
          </div>
          <dg-scroll-panel
            #programmaticPanel
            styleClass="h-48 rounded-md border border-border p-3"
          >
            @for (item of longList; track item) {
              <p class="py-1 text-sm text-text-primary">{{ item }}</p>
            }
          </dg-scroll-panel>
        </div>
        <div code>
          readonly panel = viewChild.required&lt;DynamoScrollPanel&gt;('panel');
          scrollToTop() &#123; this.panel().scrollToTop('smooth'); &#125;
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
          only once that axis actually overflows. For scrolling from outside,
          call <code class="font-mono">scrollTo</code>/<code class="font-mono"
            >scrollToTop</code
          >/<code class="font-mono">scrollToBottom</code>/<code
            class="font-mono"
            >scrollToStart</code
          >/<code class="font-mono">scrollToEnd</code> on a
          <code class="font-mono">viewChild</code> reference to the component.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class ScrollPanelDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly rows = ROWS;
  protected readonly columns = COLUMNS;
  protected readonly longList = LONG_LIST;

  private readonly programmaticPanel =
    viewChild.required<DynamoScrollPanel>('programmaticPanel');

  protected scrollToTop(): void {
    this.programmaticPanel().scrollToTop('smooth');
  }

  protected scrollToBottom(): void {
    this.programmaticPanel().scrollToBottom('smooth');
  }
}
