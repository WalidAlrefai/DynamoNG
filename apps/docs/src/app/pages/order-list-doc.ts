import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { DynamoOrderList } from '@dynamong/order-list';
import type { DynamoSelectOption } from '@dynamong/order-list';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'filter', title: 'Filter' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
  { id: 'readonly', title: 'Read-only' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'DynamoSelectOption[] (model)', default: '[]' },
  { name: 'listLabel', type: 'string', default: "'Items'" },
  { name: 'selectable', type: 'boolean', default: 'false' },
  { name: 'dragdrop', type: 'boolean', default: 'true' },
  { name: 'moveTopBottom', type: 'boolean', default: 'true' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'readOnly', type: 'boolean', default: 'false' },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterText', type: 'string (model)', default: "''" },
  { name: 'filterPlaceholder', type: 'string', default: "'Search...'" },
  {
    name: 'noResultsMessage',
    type: 'string',
    default: "'No matching items'",
  },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '320' },
];

const MANY_TASKS: DynamoSelectOption<string>[] = Array.from(
  { length: 500 },
  (_, i) => ({ label: `Task ${i + 1}`, value: `task-${i + 1}` }),
);

@Component({
  selector: 'docs-order-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOrderList, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="OrderList"
      description="A single reorderable list — drag-and-drop, ▲/▼ (and move-to-edge) buttons, full keyboard navigation, an optional filter box, and optional virtual scrolling for large lists."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind [(value)]; click/hover a row to make it active, then use the header buttons or ArrowUp/ArrowDown to move it."
      >
        <div preview class="flex flex-col gap-3">
          <dg-order-list [(value)]="tasks" listLabel="Tasks" />
          <p class="text-sm text-text-muted">
            Order: <span class="font-mono">{{ order() }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-order-list [(value)]="tasks" listLabel="Tasks" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="filter"
        title="Filter"
        description="Set filterable to show a search box that narrows rows by label. Drag-and-drop is disabled while a query is active — use the move buttons or ▲/▼ keyboard reorder instead."
      >
        <div preview class="flex flex-col gap-3">
          <dg-order-list
            [(value)]="filterTasks"
            listLabel="Tasks"
            [filterable]="true"
          />
        </div>
        <div code>
          &lt;dg-order-list [(value)]="tasks" [filterable]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="Set virtualScroll for large value arrays — only a small rendered window mounts. Drag-and-drop is disabled while virtualized; use the move buttons or ▲/▼ keyboard reorder instead."
      >
        <div preview class="flex flex-col gap-3">
          <dg-order-list
            [(value)]="manyTasks"
            listLabel="Tasks"
            [virtualScroll]="true"
          />
          <p class="text-sm text-text-muted">
            500 tasks — only a small rendered window ever mounts.
          </p>
        </div>
        <div code>
          &lt;dg-order-list [(value)]="tasks" [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="readonly"
        title="Read-only"
        description="readOnly keeps rows visible/focusable/navigable, but blocks reordering and selection — unlike disabled, it doesn't dim the list or remove it from the tab order."
      >
        <div preview class="flex flex-col gap-3">
          <dg-order-list
            [value]="readonlyTasks()"
            listLabel="Tasks (read-only)"
            [readOnly]="true"
          />
        </div>
        <div code>
          &lt;dg-order-list [value]="tasks" [readOnly]="true" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          Set <code class="font-mono">selectable</code> to add per-row
          checkboxes.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class OrderListDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
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

  protected readonly readonlyTasks = signal<DynamoSelectOption<string>[]>([
    { label: 'Draft the proposal', value: '1' },
    { label: 'Review with the team', value: '2' },
    { label: 'Incorporate feedback', value: '3' },
  ]);

  protected readonly filterTasks = signal<DynamoSelectOption<string>[]>([
    { label: 'Draft the proposal', value: '1' },
    { label: 'Review with the team', value: '2' },
    { label: 'Incorporate feedback', value: '3' },
    { label: 'Send for sign-off', value: '4' },
    { label: 'Publish', value: '5' },
  ]);

  protected readonly manyTasks =
    signal<DynamoSelectOption<string>[]>(MANY_TASKS);
}
