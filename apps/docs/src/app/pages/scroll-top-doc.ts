import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoScrollTop } from '@dynamong/scroll-top';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-scroll-top-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoScrollTop, DocPageShell],
  template: `
    <docs-page-shell
      name="Scroll Top"
      description="A floating button that scrolls to the top of the page after scrolling past a threshold."
    >
      <div demo>
        <p class="text-sm text-text-muted">
          Scroll this page down past a couple hundred pixels to see the button
          appear in the bottom-right corner.
        </p>
        <dg-scroll-top [threshold]="200" />
      </div>
      <div code>&lt;dg-scroll-top [threshold]="200" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">threshold</td>
            <td class="py-2 pr-4 font-mono">number (px)</td>
            <td class="py-2 font-mono">200</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Scroll to top'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ScrollTopDocPage {}
