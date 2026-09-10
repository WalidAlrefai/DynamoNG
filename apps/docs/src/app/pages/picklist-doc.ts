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

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

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
];

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

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class PicklistDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
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
}
