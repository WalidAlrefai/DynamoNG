import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoMegaMenu } from '@dynamong/mega-menu';
import type { DynamoMegaMenuItem } from '@dynamong/mega-menu';
import { DocPageShell } from '../components/doc-page-shell';

const ITEMS: DynamoMegaMenuItem[] = [
  {
    label: 'Products',
    columns: [
      {
        header: 'Laptops',
        items: [
          { label: 'MacBook Air' },
          { label: 'MacBook Pro' },
          { label: 'Compare models' },
        ],
      },
      {
        header: 'Desktops',
        items: [{ label: 'iMac' }, { label: 'Mac mini' }, { label: 'Mac Studio' }],
      },
      {
        header: 'Accessories',
        items: [{ label: 'Keyboard' }, { label: 'Mouse' }, { label: 'Trackpad' }],
      },
    ],
  },
  {
    label: 'Solutions',
    columns: [
      {
        header: 'By team',
        items: [{ label: 'Engineering' }, { label: 'Design' }, { label: 'Sales' }],
      },
      {
        header: 'By size',
        items: [{ label: 'Startup' }, { label: 'Mid-market' }, { label: 'Enterprise' }],
      },
    ],
  },
  { label: 'Pricing' },
  { label: 'Contact' },
];

@Component({
  selector: 'docs-mega-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMegaMenu, DocPageShell],
  template: `
    <docs-page-shell
      name="MegaMenu"
      description="A horizontal (or vertical) bar whose items open a single multi-column panel of links, with full keyboard navigation."
    >
      <div demo>
        <dg-mega-menu [items]="items" ariaLabel="Main" />
      </div>
      <div code>&lt;dg-mega-menu [items]="items" ariaLabel="Main" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">DynamoMegaMenuItem[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">orientation</td>
            <td class="py-2 pr-4 font-mono">'horizontal' | 'vertical'</td>
            <td class="py-2 font-mono">'horizontal'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">openIndex</td>
            <td class="py-2 pr-4 font-mono">number | null (model)</td>
            <td class="py-2 font-mono">null</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">linkSelect</td>
            <td class="py-2 pr-4 font-mono">output&lt;DynamoMegaMenuLink&gt;</td>
            <td class="py-2 font-mono">—</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        An item with no <code class="font-mono">columns</code> is a leaf that fires its
        <code class="font-mono">command</code> directly. Real focus stays on the open bar item; a
        virtual-focus cursor moves over the panel links via
        <code class="font-mono">aria-activedescendant</code>.
      </p>
    </docs-page-shell>
  `,
})
export class MegaMenuDocPage {
  protected readonly items = ITEMS;
}
