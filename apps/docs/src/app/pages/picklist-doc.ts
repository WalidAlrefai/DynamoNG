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
  { id: 'filterable', title: 'Filterable' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
  { id: 'templates', title: 'Custom Templates' },
  { id: 'reorder-visibility', title: 'Reorder-Button Visibility' },
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
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'sourceFilterText', type: 'string (model)', default: "''" },
  { name: 'targetFilterText', type: 'string (model)', default: "''" },
  { name: 'filterPlaceholder', type: 'string', default: "'Search...'" },
  {
    name: 'noResultsMessage',
    type: 'string',
    default: "'No matching options'",
  },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '36' },
  { name: 'virtualScrollHeight', type: 'number', default: '320' },
  { name: 'showSourceReorderButtons', type: 'boolean', default: 'true' },
  { name: 'showTargetReorderButtons', type: 'boolean', default: 'true' },
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
        description="Two-way bind both lists with [(source)] and [(target)]; items move between them via the centre buttons, drag-and-drop, or keyboard. Panels stack vertically with a horizontal move-button row below the sm breakpoint — resize your viewport narrow to see it."
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
        exampleId="filterable"
        title="Filterable"
        description="filterable shows a per-panel search box that narrows that panel's rows by label — filtering one panel disables its own drag-and-drop but leaves the other panel unaffected."
      >
        <div preview class="flex flex-col gap-3">
          <dg-picklist
            [(source)]="filterableSource"
            [(target)]="filterableTarget"
            sourceLabel="Available"
            targetLabel="Selected"
            [filterable]="true"
          />
        </div>
        <div code>
          &lt;dg-picklist [(source)]="available" [(target)]="selected"
          [filterable]="true" /&gt;
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

      <docs-example
        exampleId="templates"
        title="Custom Templates"
        description="Project an #optionTemplate to render arbitrary content per row, shared across both panels — here, a colored dot ahead of the label. Falls back to plain text when omitted."
      >
        <div preview class="flex flex-col gap-3">
          <dg-picklist
            [(source)]="templateSource"
            [(target)]="templateTarget"
            sourceLabel="Available"
            targetLabel="Selected"
          >
            <ng-template #optionTemplate let-option>
              <span
                class="inline-block h-2.5 w-2.5 rounded-full bg-primary"
              ></span>
              <span>{{ option.label }}</span>
            </ng-template>
          </dg-picklist>
        </div>
        <div code>
          &lt;dg-picklist [(source)]="available" [(target)]="selected"&gt;
          &lt;ng-template #optionTemplate let-option&gt; ...
          &lt;/ng-template&gt; &lt;/dg-picklist&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="reorder-visibility"
        title="Reorder-Button Visibility"
        description="showSourceReorderButtons / showTargetReorderButtons independently hide each panel's own ▲/▼ row — here the source panel's is hidden while the target panel's stays available."
      >
        <div preview class="flex flex-col gap-3">
          <dg-picklist
            [(source)]="reorderVisibilitySource"
            [(target)]="reorderVisibilityTarget"
            sourceLabel="Available"
            targetLabel="Selected"
            [showSourceReorderButtons]="false"
          />
        </div>
        <div code>
          &lt;dg-picklist [(source)]="available" [(target)]="selected"
          [showSourceReorderButtons]="false" /&gt;
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

  protected readonly filterableSource = signal<DynamoSelectOption<string>[]>([
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'Python', value: 'py' },
    { label: 'Ruby', value: 'ruby' },
    { label: 'Kotlin', value: 'kotlin' },
  ]);
  protected readonly filterableTarget = signal<DynamoSelectOption<string>[]>([
    { label: 'TypeScript', value: 'ts' },
    { label: 'JavaScript', value: 'js' },
  ]);

  protected readonly templateSource = signal<DynamoSelectOption<string>[]>([
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'Python', value: 'py' },
  ]);
  protected readonly templateTarget = signal<DynamoSelectOption<string>[]>([
    { label: 'TypeScript', value: 'ts' },
  ]);

  protected readonly reorderVisibilitySource = signal<
    DynamoSelectOption<string>[]
  >([
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'Python', value: 'py' },
  ]);
  protected readonly reorderVisibilityTarget = signal<
    DynamoSelectOption<string>[]
  >([
    { label: 'TypeScript', value: 'ts' },
    { label: 'JavaScript', value: 'js' },
  ]);
}
