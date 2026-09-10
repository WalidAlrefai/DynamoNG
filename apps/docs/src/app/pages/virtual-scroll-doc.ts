import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

function generateItems(count: number): { index: number; label: string }[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    label: `Row ${i + 1}`,
  }));
}

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'items', type: 'readonly T[] (required)', default: '—' },
  { name: 'itemSize', type: 'number (required)', default: '—' },
  { name: 'height', type: 'number (required)', default: '—' },
  {
    name: 'trackBy',
    type: '((item: T, index: number) => unknown) | undefined',
    default: 'undefined',
  },
];

@Component({
  selector: 'docs-virtual-scroll-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoVirtualScroll, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="VirtualScroll"
      description="A fixed-size virtual-scrolling viewport for rendering large lists efficiently — used to power optional virtualization in Select and Table."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass items, a fixed itemSize, and a viewport height; one projected <ng-template let-item let-i=&quot;index&quot;> renders each visible row."
      >
        <div preview class="rounded-md border border-border p-2">
          <dg-virtual-scroll [items]="items" [itemSize]="32" [height]="320">
            <ng-template let-item let-i="index">
              <div
                class="flex items-center gap-3 border-b border-border px-3 py-1.5 text-sm text-text-primary"
              >
                <span class="font-mono text-text-muted">{{ i }}</span>
                <span>{{ item.label }}</span>
              </div>
            </ng-template>
          </dg-virtual-scroll>
          <p class="mt-2 text-sm text-text-muted">
            10,000 rows — only a small rendered window ever mounts in the DOM.
          </p>
        </div>
        <div code>
          &lt;dg-virtual-scroll [items]="items" [itemSize]="32" [height]="320"&gt;
          &lt;ng-template let-item let-i="index"&gt;...&lt;/ng-template&gt;
          &lt;/dg-virtual-scroll&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          Fixed-size strategy only — every row must be the same
          <code class="font-mono">itemSize</code>. Also exposes
          <code class="font-mono">scrollToIndex(index)</code> /
          <code class="font-mono">scrollToOffset(offset)</code> for consumers
          with their own roving-focus concept.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class VirtualScrollDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly items = generateItems(10000);
}
