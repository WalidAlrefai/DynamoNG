import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTieredMenu } from '@dynamong/tiered-menu';
import type { DynamoTieredMenuItem } from '@dynamong/tiered-menu';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-tiered-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTieredMenu, DocPageShell],
  template: `
    <docs-page-shell
      name="Tiered Menu"
      description="A nested multi-level action menu — submenus flyout to the side, with full keyboard navigation across levels."
    >
      <div demo>
        <dg-tiered-menu label="File" [items]="items" (itemSelect)="lastSelected.set($event.label)" />
        @if (lastSelected(); as selected) {
          <p class="mt-2 text-sm text-text-muted">
            Last action: <span class="font-mono">{{ selected }}</span>
          </p>
        }
      </div>
      <div code>
        &lt;dg-tiered-menu label="File" [items]="items" (itemSelect)="onSelect($event)" /&gt;
      </div>
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
            <td class="py-2 pr-4 font-mono">DynamoTieredMenuItem[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'</td>
            <td class="py-2 font-mono">'bottom-start'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">DynamoTieredMenuItem</code>:
        <code class="font-mono">label</code> (required),
        <code class="font-mono">disabled?</code>,
        <code class="font-mono">children?</code> (nested items — hover, click, or ArrowRight/Enter opens a
        flyout), <code class="font-mono">command?</code> (invoked when a leaf item is committed, alongside the
        <code class="font-mono">itemSelect</code> output).
      </p>
    </docs-page-shell>
  `,
})
export class TieredMenuDocPage {
  protected readonly lastSelected = signal<string | null>(null);
  protected readonly items: DynamoTieredMenuItem[] = [
    {
      label: 'New',
      children: [{ label: 'Document' }, { label: 'Spreadsheet' }, { label: 'Presentation' }],
    },
    {
      label: 'Export',
      children: [{ label: 'PDF' }, { label: 'CSV' }],
    },
    { label: 'Print' },
    { label: 'Share', disabled: true },
  ];
}
