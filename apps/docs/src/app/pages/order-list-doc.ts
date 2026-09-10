import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DynamoOrderList } from '@dynamong/order-list';
import type { DynamoSelectOption } from '@dynamong/order-list';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-order-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOrderList, DocPageShell],
  template: `
    <docs-page-shell
      name="OrderList"
      description="A single reorderable list — drag-and-drop, ▲/▼ (and move-to-edge) buttons, and full keyboard navigation."
    >
      <div demo class="flex flex-col gap-3">
        <dg-order-list [(value)]="tasks" listLabel="Tasks" />
        <p class="text-sm text-text-muted">
          Order: <span class="font-mono">{{ order() }}</span>
        </p>
      </div>
      <div code>&lt;dg-order-list [(value)]="tasks" listLabel="Tasks" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">DynamoSelectOption[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">listLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Items'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selectable</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dragdrop</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">moveTopBottom</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        Click or hover a row to make it active, then use the header buttons or
        <code class="font-mono">ArrowUp</code>/<code class="font-mono">ArrowDown</code> to move it.
        Set <code class="font-mono">selectable</code> to add per-row checkboxes.
      </p>
    </docs-page-shell>
  `,
})
export class OrderListDocPage {
  protected readonly tasks = signal<DynamoSelectOption<string>[]>([
    { label: 'Draft the proposal', value: '1' },
    { label: 'Review with the team', value: '2' },
    { label: 'Incorporate feedback', value: '3' },
    { label: 'Send for sign-off', value: '4' },
    { label: 'Publish', value: '5' },
  ]);

  protected readonly order = computed(() =>
    this.tasks()
      .map((t) => t.label)
      .join(' → '),
  );
}
