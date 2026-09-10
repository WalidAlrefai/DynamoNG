import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoInputGroup } from '@dynamong/input-group';
import { DynamoInputText } from '@dynamong/input-text';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'prefix-suffix', title: 'Prefix & Suffix' },
  { id: 'invalid', title: 'Invalid' },
];

const API: ApiTableRow[] = [
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'invalid', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-input-group-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoInputGroup,
    DynamoInputText,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Input Group"
      description="A bordered wrapper adding prefix/suffix content — an icon, a $ sign, a unit label — alongside any projected input."
      [examples]="examples"
    >
      <docs-example
        exampleId="prefix-suffix"
        title="Prefix & Suffix"
        description="Project [prefix] / [suffix] content around an unstyled input so only the group's border shows."
      >
        <div preview class="w-40">
          <dg-input-group>
            <span prefix>$</span>
            <dg-input-text
              [unstyled]="true"
              styleClass="min-w-0 flex-1 bg-transparent outline-none"
              placeholder="0.00"
              ariaLabel="Amount"
            />
            <span suffix>USD</span>
          </dg-input-group>
        </div>
        <div code>
          &lt;dg-input-group&gt; &lt;span prefix&gt;$&lt;/span&gt;
          &lt;dg-input-text [unstyled]="true" styleClass="min-w-0 flex-1
          bg-transparent outline-none" /&gt; &lt;span suffix&gt;USD&lt;/span&gt;
          &lt;/dg-input-group&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid moves the error styling to the group border; the prefix can hold an icon."
      >
        <div preview class="max-w-xs">
          <dg-input-group [invalid]="true">
            <span prefix>
              <svg
                viewBox="0 0 20 20"
                class="h-4 w-4"
                fill="none"
                [attr.aria-hidden]="true"
              >
                <path
                  d="M9 17a8 8 0 100-16 8 8 0 000 16zM19 19l-4.35-4.35"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <dg-input-text
              [unstyled]="true"
              styleClass="min-w-0 flex-1 bg-transparent outline-none"
              placeholder="Search..."
              ariaLabel="Search"
            />
          </dg-input-group>
        </div>
        <div code>
          &lt;dg-input-group [invalid]="true"&gt; &lt;span
          prefix&gt;&lt;svg&gt;…&lt;/svg&gt;&lt;/span&gt; &lt;dg-input-text
          [unstyled]="true" /&gt; &lt;/dg-input-group&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          Every DynamoNG input already renders its own border. Pass
          <code class="font-mono">[unstyled]="true"</code> (plus enough
          <code class="font-mono">styleClass</code> to size and reset it) to any
          input placed inside
          <code class="font-mono">&lt;dg-input-group&gt;</code> so only the
          group's border shows. The group has no
          <code class="font-mono">disabled</code> input — disable the projected
          input directly.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class InputGroupDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
