import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoDock } from '@dynamong/dock';
import type { DynamoDockItem, DynamoDockPosition } from '@dynamong/dock';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-dock-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoDock, DocPageShell],
  template: `
    <docs-page-shell
      name="Dock"
      description="A macOS-style dock — a row or column of icon items that magnify toward the pointer, with roving-focus keyboard navigation."
    >
      <div demo class="flex flex-col items-center gap-8 py-6">
        <dg-dock [items]="items" ariaLabel="Apps" />
        @if (last(); as label) {
          <p class="text-sm text-text-muted">
            Launched: <span class="font-mono">{{ label }}</span>
          </p>
        }
      </div>
      <div code>&lt;dg-dock [items]="items" ariaLabel="Apps" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">DynamoDockItem[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">'bottom' | 'top' | 'left' | 'right'</td>
            <td class="py-2 font-mono">'bottom'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">magnification</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">magnificationScale</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">1.6</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">magnificationRange</td>
            <td class="py-2 pr-4 font-mono">number (px)</td>
            <td class="py-2 font-mono">140</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class DockDocPage {
  protected readonly position: DynamoDockPosition = 'bottom';
  protected readonly last = signal<string | null>(null);
  protected readonly items: DynamoDockItem[] = [
    { label: 'Finder', icon: '🔍', command: () => this.last.set('Finder') },
    { label: 'Mail', icon: '✉', command: () => this.last.set('Mail') },
    { label: 'Calendar', icon: '📅', command: () => this.last.set('Calendar') },
    { label: 'Photos', icon: '🖼', command: () => this.last.set('Photos') },
    { label: 'Music', icon: '♫', command: () => this.last.set('Music') },
    { label: 'Trash', icon: '🗑', disabled: true },
  ];
}
