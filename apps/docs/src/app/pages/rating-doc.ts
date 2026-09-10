import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoRating } from '@dynamong/rating';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'read-only', title: 'Read Only' },
];

@Component({
  selector: 'docs-rating-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoRating, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Rating"
      description="A star rating control with click, hover-preview, and keyboard support."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind the star count with [(value)]."
        [code]="basicCode"
      >
        <div preview class="flex flex-col gap-2">
          <dg-rating [(value)]="stars" ariaLabel="Rate this product" />
          <p class="text-sm text-text-muted">
            Value: <span class="font-mono">{{ stars() }}</span>
          </p>
        </div>
      </docs-example>

      <docs-example
        exampleId="read-only"
        title="Read Only"
        description="readOnly renders a non-interactive rating — e.g. an average score."
        [code]="readOnlyCode"
      >
        <div preview>
          <dg-rating [value]="4" [readOnly]="true" ariaLabel="Average rating" />
        </div>
      </docs-example>

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
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">0</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">max</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">5</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">readOnly</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-examples-layout>
  `,
})
export class RatingDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly stars = signal(3);

  protected readonly basicCode = `<dg-rating [(value)]="stars" ariaLabel="Rate this product" />`;
  protected readonly readOnlyCode = `<dg-rating [value]="4" [readOnly]="true" ariaLabel="Average rating" />`;
}
