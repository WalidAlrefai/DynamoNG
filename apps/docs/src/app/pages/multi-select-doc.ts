import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoMultiSelect } from '@dynamong/multi-select';
import type { DynamoSelectOption } from '@dynamong/multi-select';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const SKILL_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Angular', value: 'angular' },
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'CSS (disabled)', value: 'css', disabled: true },
];

const MANY_OPTIONS: DynamoSelectOption<string>[] = Array.from(
  { length: 5000 },
  (_, i) => ({ label: `Option ${i + 1}`, value: `option-${i + 1}` }),
);

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'max-tags', title: 'Max Visible Tags' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
];

@Component({
  selector: 'docs-multi-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMultiSelect, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Multi Select"
      description="A multi-select combobox with tag display, filtering, a header select-all/clear-all checkbox, a max-selection cap, and single-level option grouping."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind an options array and a value array; set filterable for a search box in the panel."
      >
        <div preview class="max-w-sm">
          <dg-multi-select
            [options]="options"
            ariaLabel="Skills"
            placeholder="Choose skills"
            [filterable]="true"
          />
        </div>
        <div code>
          &lt;dg-multi-select [options]="options" [(value)]="skills"
          [filterable]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="max-tags"
        title="Max Visible Tags"
        description="maxVisibleTags collapses the overflow into a “+N” chip instead of an unbounded tag row."
      >
        <div preview class="max-w-sm">
          <dg-multi-select
            [options]="options"
            ariaLabel="Skills (capped tags)"
            placeholder="Choose skills"
            [maxVisibleTags]="2"
          />
        </div>
        <div code>
          &lt;dg-multi-select [options]="options" [maxVisibleTags]="2" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="Set virtualScroll for large option lists — only a small rendered window mounts."
      >
        <div preview class="max-w-sm">
          <dg-multi-select
            [options]="manyOptions"
            ariaLabel="Option (virtualized)"
            placeholder="Choose from 5,000 options"
            [filterable]="true"
            [maxVisibleTags]="3"
            [virtualScroll]="true"
          />
          <p class="mt-2 text-sm text-text-muted">
            5,000 options — only a small rendered window ever mounts in the DOM.
          </p>
        </div>
        <div code>
          &lt;dg-multi-select [options]="manyOptions" [filterable]="true"
          [virtualScroll]="true" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
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
              <td class="py-2 pr-4 font-mono">
                DynamoSelectOption[] (required)
              </td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">value</td>
              <td class="py-2 pr-4 font-mono">TValue[] (model)</td>
              <td class="py-2 font-mono">[]</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">filterable</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">maxSelected</td>
              <td class="py-2 pr-4 font-mono">number | undefined</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">showSelectAll</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">true</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">maxVisibleTags</td>
              <td class="py-2 pr-4 font-mono">number | undefined</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">tagRemoved</td>
              <td class="py-2 pr-4 font-mono">output&lt;TValue&gt;</td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">
                virtualScroll / ...ItemSize / ...Height
              </td>
              <td class="py-2 pr-4 font-mono">boolean / number / number</td>
              <td class="py-2 font-mono">false / 36 / 240</td>
            </tr>
          </tbody>
        </table>
        <p class="text-sm text-text-muted">
          <code class="font-mono">virtualScroll</code> only takes effect for the
          ungrouped case (fixed-row-height only). A grouped MultiSelect falls
          back to the full, non-virtualized render.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class MultiSelectDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly options = SKILL_OPTIONS;
  protected readonly manyOptions = MANY_OPTIONS;
}
