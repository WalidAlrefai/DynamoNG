import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoMeterGroup } from '@dynamong/meter-group';
import type { DynamoMeterItem } from '@dynamong/meter-group';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const STORAGE: DynamoMeterItem[] = [
  { label: 'Documents', value: 22, severity: 'primary' },
  { label: 'Photos', value: 31, severity: 'info' },
  { label: 'Videos', value: 18, severity: 'warning' },
  { label: 'Apps', value: 9, severity: 'success' },
];

const EXAMPLES: DocExampleRef[] = [
  { id: 'horizontal', title: 'Horizontal' },
  { id: 'vertical', title: 'Vertical' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'DynamoMeterItem[] (required)', default: '—' },
  { name: 'max', type: 'number', default: '100' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'" },
  { name: 'showLegend', type: 'boolean', default: 'true' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
];

@Component({
  selector: 'docs-meter-group-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoMeterGroup, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="MeterGroup"
      description="A multi-segment labelled meter bar with a legend — for a breakdown like disk usage or a budget split. The multi-value sibling of Progress."
      [examples]="examples"
    >
      <docs-example
        exampleId="horizontal"
        title="Horizontal"
        description="Pass an array of { label, value, severity? } items; segments are stacked left to right."
      >
        <div preview class="max-w-md">
          <dg-meter-group [value]="storage" ariaLabel="Storage breakdown" />
        </div>
        <div code>&lt;dg-meter-group [value]="storage" ariaLabel="Storage" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="vertical"
        title="Vertical"
        description="orientation=&quot;vertical&quot; stacks the segments bottom to top."
      >
        <div preview class="max-w-md">
          <dg-meter-group
            [value]="storage"
            orientation="vertical"
            [showLegend]="true"
          />
        </div>
        <div code>
          &lt;dg-meter-group [value]="storage" orientation="vertical" /&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          Each <code class="font-mono">DynamoMeterItem</code> is
          <code class="font-mono"
            >&#123; label, value, severity?, color? &#125;</code
          >. Segments that would sum past
          <code class="font-mono">max</code> are scaled down proportionally so
          the bar never overflows.
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class MeterGroupDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly storage = STORAGE;
}
