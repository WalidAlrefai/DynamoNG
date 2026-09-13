import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
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
  { name: 'rootMargin', type: 'string | undefined', default: 'undefined' },
  { name: 'root', type: 'Element | null', default: 'null' },
];

@Component({
  selector: 'docs-animate-on-scroll-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAnimateOnScroll, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="AnimateOnScroll"
      description="dgAnimateOnScroll — adds an animation class when the element scrolls into view (IntersectionObserver); optional enter/leave with once=false."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description='enterClass is applied when the element crosses into view; with [once]="false" and a leaveClass it toggles both ways. root scopes the IntersectionObserver to this scrollable box instead of the page viewport, so scrolling the box (not the page) drives the animation.'
      >
        <div preview class="space-y-4">
          <p class="text-sm text-text-muted">
            Scroll the box; each card fades up as it enters.
          </p>
          <div
            #scrollBox
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
                [root]="scrollBoxEl()"
                class="translate-y-4 rounded-md bg-surface-100 p-6 opacity-0 transition-all duration-500"
              >
                Card {{ n }}
              </div>
            }
          </div>
        </div>
        <div code>
          &lt;div #scrollBox&gt; &lt;div dgAnimateOnScroll
          enterClass="opacity-100 translate-y-0" leaveClass="opacity-0
          translate-y-4" [once]="false" [root]="scrollBox"&gt; ... &lt;/div&gt;
          &lt;/div&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class AnimateOnScrollDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  private readonly scrollBox = viewChild<ElementRef<HTMLElement>>('scrollBox');
  protected scrollBoxEl(): Element | null {
    return this.scrollBox()?.nativeElement ?? null;
  }
}
