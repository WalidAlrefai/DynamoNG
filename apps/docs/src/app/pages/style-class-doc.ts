import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoStyleClass } from '@dynamong/style-class';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'toggle', title: 'Toggle Class' },
  { id: 'enter-leave', title: 'Enter / Leave' },
];

const API: ApiTableRow[] = [
  {
    name: 'dgStyleClass',
    type: "CSS selector | '@next' | '@prev' | '@parent' | '@grandparent'",
    default: 'required',
  },
  { name: 'toggleClass', type: 'string', default: '—' },
  { name: 'enterClass / leaveClass', type: 'string', default: '—' },
  { name: 'hideOnOutsideClick', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-style-class-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoStyleClass, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="StyleClass"
      description="dgStyleClass — on click, toggles / swaps CSS classes on a target element resolved by selector or the @next/@parent/@prev/@grandparent keywords."
      [examples]="examples"
    >
      <docs-example
        exampleId="toggle"
        title="Toggle Class"
        description="toggleClass is added/removed on the resolved target each click. Here the target is the @next sibling."
      >
        <div preview class="space-y-2">
          <button
            type="button"
            dgStyleClass="@next"
            toggleClass="hidden"
            class="rounded-md border border-border px-3 py-1 text-sm"
          >
            Toggle panel (&#64;next)
          </button>
          <div class="rounded-md bg-surface-100 p-4 text-sm">
            I appear and disappear — my
            <code class="font-mono">hidden</code> class is toggled.
          </div>
        </div>
        <div code>
          &lt;button dgStyleClass="&#64;next"
          toggleClass="hidden"&gt;Toggle&lt;/button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="enter-leave"
        title="Enter / Leave"
        description="enterClass / leaveClass swap on alternating clicks; hideOnOutsideClick reverts when you click away."
      >
        <div preview class="space-y-2">
          <button
            type="button"
            dgStyleClass="#slide"
            enterClass="translate-x-0"
            leaveClass="-translate-x-full"
            [hideOnOutsideClick]="true"
            class="rounded-md border border-border px-3 py-1 text-sm"
          >
            Slide in / out (click away to close)
          </button>
          <div class="overflow-hidden">
            <div
              id="slide"
              class="-translate-x-full rounded-md bg-primary/10 p-4 text-sm transition-transform duration-300"
            >
              Enter / leave classes swap on alternating clicks.
            </div>
          </div>
        </div>
        <div code>
          &lt;button dgStyleClass="#panel" enterClass="translate-x-0"
          leaveClass="-translate-x-full" [hideOnOutsideClick]="true"&gt;
          Toggle &lt;/button&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class StyleClassDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
