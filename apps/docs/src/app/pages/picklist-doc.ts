import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { DynamoPicklist } from '@dynamong/picklist';
import type { DynamoSelectOption } from '@dynamong/picklist';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'readonly', title: 'Read-only' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

const API: ApiTableRow[] = [
  { name: 'source', type: 'DynamoSelectOption[] (model)', default: '[]' },
  { name: 'target', type: 'DynamoSelectOption[] (model)', default: '[]' },
  {
    name: 'sourceLabel / targetLabel',
    type: 'string',
    default: "'Available' / 'Selected'",
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'readOnly', type: 'boolean', default: 'false' },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '320' },
];

const MANY_SOURCE: DynamoSelectOption<string>[] = Array.from(
  { length: 500 },
  (_, i) => ({ label: `Option ${i + 1}`, value: `option-${i + 1}` }),
);

@Component({
  selector: 'docs-picklist-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPicklist, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="PickList"
      description="A dual-list transfer widget — move items between an available and a selected list via buttons, drag-and-drop, or keyboard reorder controls."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind both lists with [(source)] and [(target)]; items move between them via the centre buttons, drag-and-drop, or keyboard."
      >
        <div preview class="flex flex-col gap-3">
          <dg-picklist
            [(source)]="available"
            [(target)]="selected"
            sourceLabel="Available"
            targetLabel="Selected"
          />
          <p class="text-sm text-text-muted">
            Selected:
            <span class="font-mono">{{ selectedLabels() || '(none)' }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-picklist [(source)]="available" [(target)]="selected" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="readonly"
        title="Read-only"
        description="readOnly keeps both panels visible/focusable/navigable, but blocks moving items and selection — unlike disabled, it doesn't dim either panel or remove it from the tab order."
      >
        <div preview class="flex flex-col gap-3">
          <dg-picklist
            [source]="readonlySource()"
            [target]="readonlyTarget()"
            sourceLabel="Available"
            targetLabel="Selected"
            [readOnly]="true"
          />
        </div>
        <div code>
          &lt;dg-picklist [source]="available" [target]="selected"
          [readOnly]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="Set virtualScroll for large source/target arrays — only a small rendered window mounts per panel. Drag-and-drop is disabled while virtualized; use the move buttons or ▲/▼ keyboard reorder instead."
      >
        <div preview class="flex flex-col gap-3">
          <dg-picklist
            [(source)]="manySource"
            [(target)]="manyTarget"
            sourceLabel="Available"
            targetLabel="Selected"
            [virtualScroll]="true"
          />
          <p class="text-sm text-text-muted">
            500 options — only a small rendered window ever mounts per panel.
          </p>
        </div>
        <div code>
          &lt;dg-picklist [(source)]="available" [(target)]="selected"
          [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class PicklistDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly manySource =
    signal<DynamoSelectOption<string>[]>(MANY_SOURCE);
  protected readonly manyTarget = signal<DynamoSelectOption<string>[]>([]);
  protected readonly available = signal<DynamoSelectOption<string>[]>([
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'Python', value: 'py' },
    { label: 'Kotlin', value: 'kotlin', disabled: true },
  ]);
  protected readonly selected = signal<DynamoSelectOption<string>[]>([
    { label: 'TypeScript', value: 'ts' },
  ]);

  protected readonly selectedLabels = computed(() =>
    this.selected()
      .map((o) => o.label)
      .join(', '),
  );

  protected readonly readonlySource = signal<DynamoSelectOption<string>[]>([
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
  ]);
  protected readonly readonlyTarget = signal<DynamoSelectOption<string>[]>([
    { label: 'TypeScript', value: 'ts' },
  ]);
}
