import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoRipple } from '@dynamong/ripple';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'dgRippleDisabled', type: 'boolean', default: 'false' },
  { name: 'dgRippleColor', type: 'string (CSS colour)', default: 'bg-current/30' },
];

@Component({
  selector: 'docs-ripple-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoRipple, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Ripple"
      description="dgRipple — a Material-style pointer ripple animated with the Web Animations API; honours prefers-reduced-motion."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Add dgRipple to any element. dgRippleColor overrides the tint; dgRippleDisabled turns it off."
      >
        <div preview class="flex flex-wrap gap-4">
          <button
            type="button"
            dgRipple
            class="rounded-md bg-primary px-4 py-2 text-on-primary"
          >
            Primary
          </button>
          <button
            type="button"
            dgRipple
            dgRippleColor="rgba(16,185,129,0.35)"
            class="rounded-md bg-surface-100 px-4 py-2 text-text-primary"
          >
            Custom colour
          </button>
          <button
            type="button"
            dgRipple
            [dgRippleDisabled]="true"
            class="rounded-md border border-border px-4 py-2 text-text-muted"
          >
            Disabled
          </button>
        </div>
        <div code>&lt;button dgRipple&gt;Click me&lt;/button&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class RippleDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
