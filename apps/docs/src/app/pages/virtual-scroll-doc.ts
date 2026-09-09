import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { DocPageShell } from '../components/doc-page-shell';

function generateItems(count: number): { index: number; label: string }[] {
  return Array.from({ length: count }, (_, i) => ({ index: i, label: `Row ${i + 1}` }));
}

@Component({
  selector: 'docs-virtual-scroll-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoVirtualScroll, DocPageShell],
  template: `
    <docs-page-shell
      name="VirtualScroll"
      description="A fixed-size virtual-scrolling viewport for rendering large lists efficiently — used to power optional virtualization in Select and Table."
    >
      <div demo class="rounded-md border border-border p-2">
        <dg-virtual-scroll [items]="items" [itemSize]="32" [height]="320">
          <ng-template let-item let-i="index">
            <div class="flex items-center gap-3 border-b border-border px-3 py-1.5 text-sm text-text-primary">
              <span class="font-mono text-text-muted">{{ i }}</span>
              <span>{{ item.label }}</span>
            </div>
          </ng-template>
        </dg-virtual-scroll>
        <p class="mt-2 text-sm text-text-muted">
          10,000 rows — only a small rendered window ever mounts in the DOM. Inspect via devtools while
          scrolling to confirm.
        </p>
      </div>
      <div code>&lt;dg-virtual-scroll [items]="items" [itemSize]="32" [height]="320"&gt;
  &lt;ng-template let-item let-i="index"&gt;{{ '{{ i }}: {{ item.label }}' }}&lt;/ng-template&gt;
&lt;/dg-virtual-scroll&gt;</div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">items</td>
            <td class="py-2 pr-4 font-mono">readonly T[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">itemSize</td>
            <td class="py-2 pr-4 font-mono">number (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">height</td>
            <td class="py-2 pr-4 font-mono">number (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">trackBy</td>
            <td class="py-2 pr-4 font-mono">((item: T, index: number) =&gt; unknown) | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        Fixed-size strategy only — every row must be the same <code class="font-mono">itemSize</code>.
        A list with non-uniform row heights (e.g. a dropdown with group headings) can't be virtualized
        correctly here; render it unvirtualized instead. Also exposes
        <code class="font-mono">scrollToIndex(index)</code>/<code class="font-mono">scrollToOffset(offset)</code>
        for consumers with their own roving-focus concept — e.g. Select uses this to keep an
        off-screen "active" option actually rendered while virtualized.
      </p>
    </docs-page-shell>
  `,
})
export class VirtualScrollDocPage {
  protected readonly items = generateItems(10000);
}
