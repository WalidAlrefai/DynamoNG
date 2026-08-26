import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoRating } from '@dynamong/rating';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-rating-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoRating, DocPageShell],
  template: `
    <docs-page-shell
      name="Rating"
      description="A star rating control with click, hover-preview, and keyboard support."
    >
      <div demo class="flex flex-col gap-4">
        <dg-rating [(value)]="stars" ariaLabel="Rate this product" />
        <p class="text-sm text-text-muted">
          Value: <span class="font-mono">{{ stars() }}</span>
        </p>
        <dg-rating [value]="4" [readOnly]="true" ariaLabel="Average rating" />
      </div>
      <div code>&lt;dg-rating [(value)]="stars" /&gt;</div>
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
    </docs-page-shell>
  `,
})
export class RatingDocPage {
  protected readonly stars = signal(3);
}
