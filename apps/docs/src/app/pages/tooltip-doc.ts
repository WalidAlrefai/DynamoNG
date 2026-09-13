import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoTooltip } from '@dynamong/tooltip';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'positions', title: 'Positions' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'life', title: 'Life' },
  { id: 'ellipsis', title: 'Show on Ellipsis' },
];

const API: ApiTableRow[] = [
  { name: 'content', type: 'string', default: "''" },
  {
    name: 'position',
    type: "'top' | 'bottom' | 'left' | 'right'",
    default: "'top'",
  },
  { name: 'showDelay', type: 'number', default: '300' },
  { name: 'hideDelay', type: 'number', default: '0' },
  { name: 'trigger', type: "'hover' | 'focus' | 'both'", default: "'both'" },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'life', type: 'number | undefined', default: 'undefined' },
  { name: 'showOnEllipsis', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-tooltip-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoTooltip,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Tooltip"
      description="A hover/focus-triggered hint positioned by CDK Overlay with viewport-collision flipping."
      [examples]="examples"
    >
      <docs-example
        exampleId="positions"
        title="Positions"
        description="position sets the preferred side; it flips automatically on a viewport collision."
      >
        <div preview class="flex flex-wrap gap-8 p-8">
          <dg-tooltip content="Saves your changes" position="top">
            <dg-button>Top</dg-button>
          </dg-tooltip>
          <dg-tooltip content="Saves your changes" position="bottom">
            <dg-button>Bottom</dg-button>
          </dg-tooltip>
          <dg-tooltip content="Saves your changes" position="left">
            <dg-button>Left</dg-button>
          </dg-tooltip>
          <dg-tooltip content="Saves your changes" position="right">
            <dg-button>Right</dg-button>
          </dg-tooltip>
        </div>
        <div code>
          &lt;dg-tooltip content="Saves your changes"
          position="top"&gt;&lt;dg-button&gt;...&lt;/dg-button&gt;&lt;/dg-tooltip&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled suppresses the tooltip while keeping the wrapped element in place."
      >
        <div preview class="p-4">
          <dg-tooltip content="Can't touch this" [disabled]="true">
            <dg-button [disabled]="true">Disabled</dg-button>
          </dg-tooltip>
        </div>
        <div code>
          &lt;dg-tooltip content="..." [disabled]="true"&gt; ...
          &lt;/dg-tooltip&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="life"
        title="Life"
        description="life auto-hides the tooltip a fixed time after it appears, regardless of continued hover/focus."
      >
        <div preview class="p-4">
          <dg-tooltip content="I disappear after 2 seconds" [life]="2000">
            <dg-button>Hover me</dg-button>
          </dg-tooltip>
        </div>
        <div code>
          &lt;dg-tooltip content="..." [life]="2000"&gt; ... &lt;/dg-tooltip&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="ellipsis"
        title="Show on Ellipsis"
        description="showOnEllipsis only shows the tooltip when the trigger's own text is actually truncated — hover the first (truncated) row vs. the second (fits fine, no tooltip)."
      >
        <div preview class="flex flex-col gap-2 p-4">
          <dg-tooltip
            content="Quarterly Financial Report"
            [showOnEllipsis]="true"
          >
            <div
              class="block w-40 truncate rounded-md border border-border px-2 py-1 text-sm"
            >
              Quarterly Financial Report
            </div>
          </dg-tooltip>
          <dg-tooltip content="Q1" [showOnEllipsis]="true">
            <div
              class="block w-40 truncate rounded-md border border-border px-2 py-1 text-sm"
            >
              Q1
            </div>
          </dg-tooltip>
        </div>
        <div code>
          &lt;dg-tooltip content="..." [showOnEllipsis]="true"&gt; &lt;div
          class="truncate"&gt;...&lt;/div&gt; &lt;/dg-tooltip&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class TooltipDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
