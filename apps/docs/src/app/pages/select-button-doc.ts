import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSelectButton } from '@dynamong/select-button';
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

const EXAMPLES: DocExampleRef[] = [
  { id: 'single', title: 'Single Select' },
  { id: 'multiple', title: 'Multiple Select' },
];

const API: ApiTableRow[] = [
  { name: 'options', type: 'DynamoSelectOption[] (required)', default: '—' },
  { name: 'value', type: 'TValue | TValue[] | null (model)', default: 'null' },
  { name: 'multiple', type: 'boolean', default: 'false' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-select-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSelectButton, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Select Button"
      description="A segmented row of buttons acting as a single- or multi-select control."
      [examples]="examples"
    >
      <docs-example
        exampleId="single"
        title="Single Select"
        description="The default — exactly one option selected, bound with [(value)]."
      >
        <div preview>
          <dg-select-button
            [options]="viewOptions"
            [(value)]="view"
            ariaLabel="View"
          />
        </div>
        <div code>
          &lt;dg-select-button [options]="viewOptions" [(value)]="view" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="multiple"
        title="Multiple Select"
        description="multiple binds a value array; each button toggles independently."
      >
        <div preview>
          <dg-select-button
            [options]="tagOptions"
            [(value)]="tags"
            [multiple]="true"
            ariaLabel="Tags"
          />
        </div>
        <div code>
          &lt;dg-select-button [options]="tagOptions" [(value)]="tags"
          [multiple]="true" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SelectButtonDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly viewOptions = VIEW_OPTIONS;
  protected readonly tagOptions = TAG_OPTIONS;
  protected readonly view = signal<string | null>('list');
  protected readonly tags = signal<string[]>(['bug']);
}
