import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoPanelMenu } from '@dynamong/panel-menu';
import type { DynamoPanelMenuItem } from '@dynamong/panel-menu';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-panel-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPanelMenu, DocPageShell],
  template: `
    <docs-page-shell
      name="PanelMenu"
      description="A vertical, always-visible nested action menu that expands and collapses in place, with full keyboard navigation."
    >
      <div demo class="w-64 rounded-md border border-border p-2">
        <dg-panel-menu
          [items]="items"
          [(expandedPaths)]="expanded"
          ariaLabel="Documentation"
          (itemSelect)="lastSelected.set($event.label)"
        />
        @if (lastSelected(); as selected) {
          <p class="mt-2 text-sm text-text-muted">
            Last action: <span class="font-mono">{{ selected }}</span>
          </p>
        }
      </div>
      <div code>
        &lt;dg-panel-menu [items]="items" [(expandedPaths)]="expanded" ariaLabel="Documentation" (itemSelect)="onSelect($event)" /&gt;
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
            <td class="py-2 pr-4 font-mono">DynamoPanelMenuItem[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">expandedPaths</td>
            <td class="py-2 pr-4 font-mono">string[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">DynamoPanelMenuItem</code>:
        <code class="font-mono">label</code> (required),
        <code class="font-mono">disabled?</code>,
        <code class="font-mono">children?</code> (nested items — a branch expands in place, indenting its
        children beneath it, arbitrarily deep),
        <code class="font-mono">command?</code> (invoked when a leaf item is committed, alongside the
        <code class="font-mono">itemSelect</code> output).
        <code class="font-mono">expandedPaths</code> tracks expand state by structural position (a
        dash-joined chain of child indices), not by an id on the item.
      </p>
    </docs-page-shell>
  `,
})
export class PanelMenuDocPage {
  protected readonly lastSelected = signal<string | null>(null);
  protected readonly expanded = signal<string[]>(['0']);
  protected readonly items: DynamoPanelMenuItem[] = [
    {
      label: 'Getting Started',
      children: [
        { label: 'Installation' },
        { label: 'Quick Start' },
        {
          label: 'Configuration',
          children: [{ label: 'Themes' }, { label: 'Tokens' }],
        },
      ],
    },
    {
      label: 'Components',
      children: [{ label: 'Forms' }, { label: 'Overlay' }, { label: 'Data' }],
    },
    {
      label: 'Deprecated',
      disabled: true,
      children: [{ label: 'Legacy API' }],
    },
    { label: 'Changelog' },
  ];
}
