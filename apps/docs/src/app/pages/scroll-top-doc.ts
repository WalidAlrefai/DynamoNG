import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoScrollTop } from '@dynamong/scroll-top';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'container', title: 'Scoped to a Container' },
];

const API: ApiTableRow[] = [
  { name: 'threshold', type: 'number (px)', default: '200' },
  { name: 'ariaLabel', type: 'string', default: "'Scroll to top'" },
  { name: 'target', type: "'window' | 'parent'", default: "'window'" },
  {
    name: 'behavior',
    type: "ScrollBehavior ('auto' | 'smooth')",
    default: "'smooth'",
  },
];

@Component({
  selector: 'docs-scroll-top-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoScrollTop, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Scroll Top"
      description="A floating button that scrolls to the top of the page after scrolling past a threshold."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Place it once near the page root; it appears in the bottom-right corner once you scroll past threshold pixels."
      >
        <div preview>
          <p class="text-sm text-text-muted">
            Scroll this page down past a couple hundred pixels to see the button
            appear in the bottom-right corner.
          </p>
          <dg-scroll-top [threshold]="200" />
        </div>
        <div code>&lt;dg-scroll-top [threshold]="200" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="container"
        title="Scoped to a Container"
        description="target: 'parent' watches and scrolls the component's own DOM parent instead of the page — for a button placed inside a scrollable panel."
      >
        <div preview>
          <div
            class="relative h-40 w-64 overflow-y-auto rounded-lg border border-border p-3"
          >
            <p class="text-sm text-text-muted">
              This box scrolls independently of the page. Scroll it down to
              reveal the button.
            </p>
            <div class="h-64"></div>
            <p class="text-sm text-text-muted">You reached the bottom.</p>
            <dg-scroll-top [threshold]="50" target="parent" />
          </div>
        </div>
        <div code>
          &lt;div class="relative overflow-y-auto"&gt; ... &lt;dg-scroll-top
          target="parent" /&gt; &lt;/div&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ScrollTopDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
