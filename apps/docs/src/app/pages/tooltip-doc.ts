import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoTooltip } from '@dynamong/tooltip';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-tooltip-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoTooltip, DocPageShell],
  template: `
    <docs-page-shell
      name="Tooltip"
      description="A hover/focus-triggered hint positioned by CDK Overlay with viewport-collision flipping."
    >
      <div demo class="flex flex-wrap gap-8 p-8">
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
        <dg-tooltip content="Can't touch this" [disabled]="true">
          <dg-button [disabled]="true">Disabled</dg-button>
        </dg-tooltip>
      </div>
      <div code>
        &lt;dg-tooltip content="Saves your changes"
        position="top"&gt;&lt;dg-button&gt;...&lt;/dg-button&gt;&lt;/dg-tooltip&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">content</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">
              'top' | 'bottom' | 'left' | 'right'
            </td>
            <td class="py-2 font-mono">'top'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showDelay</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">300</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">hideDelay</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">0</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">trigger</td>
            <td class="py-2 pr-4 font-mono">'hover' | 'focus' | 'both'</td>
            <td class="py-2 font-mono">'both'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class TooltipDocPage {}
