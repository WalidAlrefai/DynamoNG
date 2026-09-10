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

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'value', type: 'DynamoSelectOption[] (model)', default: '[]' },
  { name: 'listLabel', type: 'string', default: "'Items'" },
  { name: 'selectable', type: 'boolean', default: 'false' },
  { name: 'dragdrop', type: 'boolean', default: 'true' },
  { name: 'moveTopBottom', type: 'boolean', default: 'true' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-order-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOrderList, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="OrderList"
      description="A single reorderable list — drag-and-drop, ▲/▼ (and move-to-edge) buttons, and full keyboard navigation."
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
        <div code>&lt;dg-order-list [(value)]="tasks" listLabel="Tasks" /&gt;</div>
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
}
