import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoMenubar } from '@dynamong/menubar';
import type { DynamoMenubarItem } from '@dynamong/menubar';
import { DynamoInputText } from '@dynamong/input-text';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-menubar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMenubar, DynamoInputText, DocPageShell],
  template: `
    <docs-page-shell
      name="Menubar"
      description="An always-visible, top-level horizontal navigation bar — dropdown submenus with nested side-flyout submenus and full keyboard navigation."
    >
      <div demo>
        <dg-menubar [items]="items" ariaLabel="Example" (itemSelect)="lastSelected.set($event.label)">
          <span start class="pl-2 font-semibold">Acme</span>
          <dg-input-text end placeholder="Search…" ariaLabel="Search" />
        </dg-menubar>
        @if (lastSelected(); as selected) {
          <p class="mt-2 text-sm text-text-muted">
            Last action: <span class="font-mono">{{ selected }}</span>
          </p>
        }
      </div>
      <div code>&lt;dg-menubar [items]="items" ariaLabel="Example" (itemSelect)="onSelect($event)"&gt;
  &lt;span start&gt;Acme&lt;/span&gt;
  &lt;dg-input-text end placeholder="Search…" ariaLabel="Search" /&gt;
&lt;/dg-menubar&gt;</div>
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
            <td class="py-2 pr-4 font-mono">DynamoMenubarItem[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'</td>
            <td class="py-2 font-mono">'bottom-start'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">openIndex</td>
            <td class="py-2 pr-4 font-mono">number | null (model)</td>
            <td class="py-2 font-mono">null</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">DynamoMenubarItem</code>:
        <code class="font-mono">label</code> (required),
        <code class="font-mono">disabled?</code>,
        <code class="font-mono">children?</code> (nested items — a top-level item with children opens a
        dropdown; nested branches flyout to the side, exactly like Tiered Menu),
        <code class="font-mono">command?</code> (invoked when a leaf item is committed, alongside the
        <code class="font-mono">itemSelect</code> output). A top-level item with no
        <code class="font-mono">children</code> commits directly, with no dropdown.
      </p>
      <p class="mt-2 text-sm text-text-muted">
        <code class="font-mono">[start]</code>/<code class="font-mono">[end]</code> content projection —
        a logo/brand mark, a search input, action buttons, or anything else — sits outside the
        <code class="font-mono">role="menubar"</code> element itself, since ARIA only permits
        menuitem-family children there.
      </p>
    </docs-page-shell>
  `,
})
export class MenubarDocPage {
  protected readonly lastSelected = signal<string | null>(null);
  protected readonly items: DynamoMenubarItem[] = [
    {
      label: 'File',
      children: [
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
      ],
    },
    {
      label: 'Edit',
      children: [{ label: 'Undo' }, { label: 'Redo' }, { label: 'Cut' }, { label: 'Copy' }, { label: 'Paste' }],
    },
    {
      label: 'View',
      children: [{ label: 'Zoom In' }, { label: 'Zoom Out' }, { label: 'Fullscreen' }],
    },
    { label: 'Help' },
  ];
}
