import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoListbox } from '@dynamong/listbox';
import { DocPageShell } from '../components/doc-page-shell';

const VIEW_OPTIONS = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
  { label: 'Card', value: 'card' },
];

const TAG_OPTIONS = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Archived', value: 'archived', disabled: true },
];

const PRODUCE_OPTIONS = [
  { label: 'Apple', value: 'apple', group: 'Fruits' },
  { label: 'Banana', value: 'banana', group: 'Fruits' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
  { label: 'Potato', value: 'potato', group: 'Vegetables' },
];

const MANY_OPTIONS = Array.from({ length: 5000 }, (_, i) => ({
  label: `Option ${i + 1}`,
  value: `option-${i + 1}`,
}));

@Component({
  selector: 'docs-listbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoListbox, DocPageShell],
  template: `
    <docs-page-shell
      name="Listbox"
      description="An always-visible, single- or multi-select option list — no trigger, no overlay."
    >
      <div demo class="flex flex-wrap gap-6">
        <div class="flex flex-col gap-1">
          <span class="text-sm text-text-muted">Single-select</span>
          <dg-listbox
            class="w-48"
            [options]="viewOptions"
            [(value)]="view"
            ariaLabel="View"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-text-muted">Multi-select</span>
          <dg-listbox
            class="w-48"
            [options]="tagOptions"
            [(value)]="tags"
            [multiple]="true"
            ariaLabel="Tags"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-text-muted">Grouped options</span>
          <dg-listbox
            class="w-48"
            [options]="produceOptions"
            [(value)]="produce"
            ariaLabel="Produce"
          />
        </div>
      </div>
      <div code>
        &lt;dg-listbox [options]="viewOptions" [(value)]="view"
        ariaLabel="View" /&gt;
      </div>
      <div demo class="max-w-xs">
        <span class="text-sm text-text-muted">Virtualized (5,000 options)</span>
        <dg-listbox
          class="mt-1 w-48"
          [options]="manyOptions"
          [(value)]="manyValue"
          [virtualScroll]="true"
          ariaLabel="Option (virtualized)"
        />
        <p class="mt-2 text-sm text-text-muted">
          5,000 options — only a small rendered window ever mounts in the DOM.
        </p>
      </div>
      <div code>
        &lt;dg-listbox [options]="manyOptions" [(value)]="manyValue"
        [virtualScroll]="true" ariaLabel="Option" /&gt;
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
            <td class="py-2 pr-4 font-mono">options</td>
            <td class="py-2 pr-4 font-mono">DynamoSelectOption[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">TValue | TValue[] | null (model)</td>
            <td class="py-2 font-mono">null</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">multiple</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">virtualScroll</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">virtualScrollItemSize</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">36</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">virtualScrollHeight</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">288</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        <code class="font-mono">virtualScroll</code> only takes effect for the ungrouped case — it's
        powered by <code class="font-mono">@dynamong/virtual-scroll</code>, which is fixed-row-height
        only, and a grouped list's heading rows are a different height than option rows. A grouped
        Listbox silently falls back to the full, non-virtualized render.
      </p>
    </docs-page-shell>
  `,
})
export class ListboxDocPage {
  protected readonly viewOptions = VIEW_OPTIONS;
  protected readonly tagOptions = TAG_OPTIONS;
  protected readonly produceOptions = PRODUCE_OPTIONS;
  protected readonly manyOptions = MANY_OPTIONS;
  protected readonly view = signal<string | null>('list');
  protected readonly tags = signal<string[]>(['bug']);
  protected readonly produce = signal<string | null>(null);
  protected readonly manyValue = signal<string | null>(null);
}
