import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoListbox } from '@dynamong/listbox';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

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

const EXAMPLES: DocExampleRef[] = [
  { id: 'single', title: 'Single Select' },
  { id: 'multiple', title: 'Multiple Select' },
  { id: 'grouped', title: 'Grouped Options' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

const API: ApiTableRow[] = [
  { name: 'options', type: 'DynamoSelectOption[] (required)', default: '—' },
  { name: 'value', type: 'TValue | TValue[] | null (model)', default: 'null' },
  { name: 'multiple', type: 'boolean', default: 'false' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '288' },
];

@Component({
  selector: 'docs-listbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoListbox, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Listbox"
      description="An always-visible, single- or multi-select option list — no trigger, no overlay."
      [examples]="examples"
    >
      <docs-example
        exampleId="single"
        title="Single Select"
        description="The default — one selected value bound with [(value)]."
      >
        <div preview>
          <dg-listbox
            class="w-48"
            [options]="viewOptions"
            [(value)]="view"
            ariaLabel="View"
          />
        </div>
        <div code>
          &lt;dg-listbox [options]="viewOptions" [(value)]="view" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="multiple"
        title="Multiple Select"
        description="multiple binds a value array; click or Space toggles each option."
      >
        <div preview>
          <dg-listbox
            class="w-48"
            [options]="tagOptions"
            [(value)]="tags"
            [multiple]="true"
            ariaLabel="Tags"
          />
        </div>
        <div code>
          &lt;dg-listbox [options]="tagOptions" [(value)]="tags"
          [multiple]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="grouped"
        title="Grouped Options"
        description="Options with a group field render non-selectable group headings."
      >
        <div preview>
          <dg-listbox
            class="w-48"
            [options]="produceOptions"
            [(value)]="produce"
            ariaLabel="Produce"
          />
        </div>
        <div code>&lt;dg-listbox [options]="produceOptions" [(value)]="produce" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="Set virtualScroll for large ungrouped lists — only a small rendered window mounts."
      >
        <div preview class="max-w-xs">
          <dg-listbox
            class="w-48"
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
          [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          <code class="font-mono">virtualScroll</code> only takes effect for the
          ungrouped case (fixed-row-height only). A grouped Listbox falls back to
          the full, non-virtualized render.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class ListboxDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly viewOptions = VIEW_OPTIONS;
  protected readonly tagOptions = TAG_OPTIONS;
  protected readonly produceOptions = PRODUCE_OPTIONS;
  protected readonly manyOptions = MANY_OPTIONS;
  protected readonly view = signal<string | null>('list');
  protected readonly tags = signal<string[]>(['bug']);
  protected readonly produce = signal<string | null>(null);
  protected readonly manyValue = signal<string | null>(null);
}
