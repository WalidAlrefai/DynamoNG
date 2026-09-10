import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoProgress } from '@dynamong/progress';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'severity-size', title: 'Severity & Size' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'number', default: '0' },
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'",
    default: "'primary'",
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'ariaLabel', type: 'string | undefined', default: "'Progress'" },
];

@Component({
  selector: 'docs-progress-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoProgress, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Progress"
      description="A determinate linear progress bar with severity-colored fill."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="value is a 0–100 percentage; pass an ariaLabel for screen readers."
      >
        <div preview>
          <dg-progress [value]="30" ariaLabel="Upload progress" />
        </div>
        <div code>&lt;dg-progress [value]="30" ariaLabel="Upload progress" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="severity-size"
        title="Severity & Size"
        description="severity recolors the fill; size sets the bar thickness."
      >
        <div preview class="flex flex-col gap-3">
          <dg-progress [value]="60" severity="success" ariaLabel="Progress" />
          <dg-progress
            [value]="90"
            severity="warning"
            size="lg"
            ariaLabel="Progress"
          />
        </div>
        <div code>
          &lt;dg-progress [value]="60" severity="success" /&gt; &lt;dg-progress
          [value]="90" severity="warning" size="lg" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ProgressDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
