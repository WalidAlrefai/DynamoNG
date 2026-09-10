import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoButton } from '@dynamong/button';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoPopover, DynamoPopoverContent } from '@dynamong/popover';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  {
    name: 'position',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
  },
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'closeOnBackdropClick', type: 'boolean', default: 'true' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
];

@Component({
  selector: 'docs-popover-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoPopover,
    DynamoPopoverContent,
    DynamoButton,
    DynamoInputText,
    FormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Popover"
      description="A generic floating panel with arbitrary projected content, positioned relative to a trigger."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Project the trigger, then a <dg-popover-content> with any markup; it opens on trigger click and closes on outside click."
      >
        <div preview>
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
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class PopoverDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly filterName = signal('');
  protected readonly applied = signal<string | null>(null);
}
