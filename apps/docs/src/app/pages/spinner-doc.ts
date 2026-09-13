import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSpinner } from '@dynamong/spinner';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'sizes', title: 'Sizes' },
  { id: 'labelled', title: 'Labelled' },
  { id: 'speed', title: 'Speed' },
];

const API: ApiTableRow[] = [
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  {
    name: 'ariaLabel',
    type: 'string | undefined',
    default: 'undefined (decorative)',
  },
  { name: 'speed', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-spinner-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSpinner, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Spinner"
      description="A small loading indicator — decorative by default, or an announced status region when given a label."
      [examples]="examples"
    >
      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Inherits the current text color; size sets the diameter."
      >
        <div preview class="flex items-center gap-6 text-primary">
          <dg-spinner size="sm" />
          <dg-spinner size="md" />
          <dg-spinner size="lg" />
        </div>
        <div code>&lt;dg-spinner size="lg" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="labelled"
        title="Labelled"
        description="Passing ariaLabel turns it into an aria-live status region that announces the text."
      >
        <div preview class="text-primary">
          <dg-spinner ariaLabel="Loading results" />
        </div>
        <div code>&lt;dg-spinner ariaLabel="Loading results" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="speed"
        title="Speed"
        description="speed overrides the default 1s rotation with a raw CSS duration."
      >
        <div preview class="flex items-center gap-6 text-primary">
          <dg-spinner speed="3s" />
          <dg-spinner speed="500ms" />
        </div>
        <div code>&lt;dg-spinner speed="500ms" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SpinnerDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
