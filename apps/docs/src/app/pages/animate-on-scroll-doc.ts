import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAnimateOnScroll } from '@dynamong/animate-on-scroll';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'enterClass', type: 'string', default: 'required' },
  { name: 'leaveClass', type: 'string', default: '—' },
  { name: 'threshold', type: 'number', default: '0.1' },
  { name: 'once', type: 'boolean', default: 'true' },
  { name: 'dgAnimateOnScrollDisabled', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-animate-on-scroll-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoAnimateOnScroll,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="AnimateOnScroll"
      description="dgAnimateOnScroll — adds an animation class when the element scrolls into view (IntersectionObserver); optional enter/leave with once=false."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="enterClass is applied when the element crosses into view; with [once]=&quot;false&quot; and a leaveClass it toggles both ways."
      >
        <div preview class="space-y-4">
          <p class="text-sm text-text-muted">
            Scroll the box; each card fades up as it enters.
          </p>
          <div
            class="h-64 space-y-24 overflow-y-auto rounded-md border border-border p-6"
          >
            <div class="pt-40 text-center text-xs text-text-muted">
              keep scrolling ↓
            </div>
            @for (n of [1, 2, 3, 4]; track n) {
              <div
                dgAnimateOnScroll
                enterClass="opacity-100 translate-y-0"
                leaveClass="opacity-0 translate-y-4"
                [once]="false"
                class="translate-y-4 rounded-md bg-surface-100 p-6 opacity-0 transition-all duration-500"
              >
                Card {{ n }}
              </div>
            }
          </div>
        </div>
        <div code>
          &lt;div dgAnimateOnScroll enterClass="opacity-100 translate-y-0"
          leaveClass="opacity-0 translate-y-4" [once]="false"&gt; ... &lt;/div&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class AnimateOnScrollDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
