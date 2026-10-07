import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoMegaMenu } from '@dynamong/mega-menu';
import type { DynamoMegaMenuItem } from '@dynamong/mega-menu';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const ITEMS: DynamoMegaMenuItem[] = [
  {
    label: 'Products',
    icon: '🛍️',
    columns: [
      {
        header: 'Laptops',
        items: [
          { label: 'MacBook Air', icon: '💻', shortcut: '⌘1' },
          { label: 'MacBook Pro', icon: '💻', badge: 'New' },
          { separator: true },
          { label: 'Compare models' },
          { label: 'Coming soon', visible: false },
        ],
      },
      {
        header: 'Desktops',
        items: [
          { label: 'iMac' },
          { label: 'Mac mini' },
          { label: 'Mac Studio' },
        ],
      },
      {
        header: 'Accessories',
        items: [
          { label: 'Keyboard' },
          { label: 'Mouse' },
          { label: 'Trackpad' },
        ],
      },
    ],
  },
  {
    label: 'Solutions',
    columns: [
      {
        header: 'By team',
        items: [
          { label: 'Engineering' },
          { label: 'Design' },
          { label: 'Sales' },
        ],
      },
      {
        header: 'By size',
        items: [
          { label: 'Startup' },
          { label: 'Mid-market' },
          { label: 'Enterprise' },
        ],
      },
    ],
  },
  { label: 'Pricing' },
  { label: 'Contact' },
];

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'vertical', title: 'Vertical' },
  { id: 'item-template', title: 'Custom Item/Link Template' },
];

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoMegaMenuItem[] (required)', default: '—' },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
  },
  { name: 'openIndex', type: 'number | null (model)', default: 'null' },
  { name: 'linkSelect', type: 'output<DynamoMegaMenuLink>', default: '—' },
];

@Component({
  selector: 'docs-mega-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMegaMenu, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="MegaMenu"
      description="A horizontal (or vertical) bar whose items open a single multi-column panel of links, with full keyboard navigation."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Each item may carry columns of { header, items }; an item with no columns is a leaf that fires its command directly."
      >
        <div preview>
          <dg-mega-menu [items]="items" ariaLabel="Main" />
        </div>
        <div code>&lt;dg-mega-menu [items]="items" ariaLabel="Main" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="vertical"
        title="Vertical"
        description='orientation="vertical" renders a sidebar-like column. Once a panel is open, the sibling-switch keys always match whichever pair roves the closed bar for the current orientation (Up/Down here) — the orthogonal pair (Left/Right) moves within the open panel.'
      >
        <div preview>
          <dg-mega-menu
            [items]="items"
            orientation="vertical"
            ariaLabel="Main vertical"
          />
        </div>
        <div code>
          &lt;dg-mega-menu [items]="items" orientation="vertical"
          ariaLabel="Main" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="item-template"
        title="Custom Item/Link Template"
        description="Project #itemTemplate and/or #linkTemplate to replace the plain label text on bar items and panel links independently — icon/shortcut/badge/chevron still render around them."
      >
        <div preview>
          <dg-mega-menu [items]="templateItems" ariaLabel="Account menu">
            <ng-template #itemTemplate let-item>
              <span class="font-semibold text-primary">{{ item.label }}</span>
            </ng-template>
            <ng-template #linkTemplate let-link>
              <em>{{ link.label }}</em>
            </ng-template>
          </dg-mega-menu>
        </div>
        <div code>
          &lt;dg-mega-menu [items]="items" ariaLabel="Account menu"&gt;
          &lt;ng-template #itemTemplate let-item&gt; &lt;span
          class="font-semibold text-primary"&gt;{{ '{{ item.label }}'
          }}&lt;/span&gt; &lt;/ng-template&gt; &lt;ng-template #linkTemplate
          let-link&gt; &lt;em&gt;{{ '{{ link.label }}' }}&lt;/em&gt;
          &lt;/ng-template&gt; &lt;/dg-mega-menu&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">DynamoMegaMenuItem</code>:
          <code class="font-mono">label</code> (required),
          <code class="font-mono">icon?</code> (a plain glyph/emoji string),
          <code class="font-mono">disabled?</code>,
          <code class="font-mono">columns?</code>,
          <code class="font-mono">command?</code>. Each
          <code class="font-mono">DynamoMegaMenuLink</code> inside a column's
          <code class="font-mono">items</code> also accepts
          <code class="font-mono">icon?</code>. A column's own
          <code class="font-mono">items</code> array can also hold
          <code class="font-mono">{{ '{ separator: true }' }}</code> entries for
          a non-interactive divider row — valid inside any column's link list,
          never at the bar level itself. A bar item or link also accepts
          <code class="font-mono">visible?</code> (false omits it from render
          and keyboard nav entirely), <code class="font-mono">shortcut?</code>
          (a display-only keyboard-hint string, no binding registered), and
          <code class="font-mono">badge?</code> (a small trailing
          <code class="font-mono">dg-badge</code>). Project an
          <code class="font-mono">#itemTemplate</code> and/or
          <code class="font-mono">#linkTemplate</code> to replace a bar item's
          or panel link's plain label text with custom markup
          (icon/shortcut/badge/chevron still render around it).
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class MegaMenuDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly items = ITEMS;
  protected readonly templateItems: DynamoMegaMenuItem[] = [
    {
      label: 'Account',
      columns: [{ items: [{ label: 'Profile' }, { label: 'Billing' }] }],
    },
    { label: 'Sign out' },
  ];
}
