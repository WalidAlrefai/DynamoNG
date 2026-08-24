import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoButton } from '@dynamong/button';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoPopover, DynamoPopoverContent } from '@dynamong/popover';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-popover-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoPopover,
    DynamoPopoverContent,
    DynamoButton,
    DynamoInputText,
    DocPageShell,
    FormsModule,
  ],
  template: `
    <docs-page-shell
      name="Popover"
      description="A generic floating panel with arbitrary projected content, positioned relative to a trigger."
    >
      <div demo>
        <dg-popover ariaLabel="Filters">
          <dg-button variant="outline">Filters</dg-button>
          <dg-popover-content>
            <div class="flex w-56 flex-col gap-3">
              <div class="flex flex-col gap-1 text-sm text-text-primary">
                <span>Name</span>
                <dg-input-text [(ngModel)]="filterName" ariaLabel="Name" />
              </div>
              <dg-button (click)="applied.set(filterName())">Apply</dg-button>
            </div>
          </dg-popover-content>
        </dg-popover>
        @if (applied(); as value) {
          <p class="mt-2 text-sm text-text-muted">
            Applied: <span class="font-mono">{{ value }}</span>
          </p>
        }
      </div>
      <div code>
        &lt;dg-popover&gt; &lt;dg-button&gt;Filters&lt;/dg-button&gt;
        &lt;dg-popover-content&gt;...&lt;/dg-popover-content&gt; &lt;/dg-popover&gt;
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
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">
              'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
            </td>
            <td class="py-2 font-mono">'bottom-start'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">closeOnBackdropClick</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class PopoverDocPage {
  protected readonly filterName = signal('');
  protected readonly applied = signal<string | null>(null);
}
