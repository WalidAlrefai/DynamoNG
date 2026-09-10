import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAnimateOnScroll } from '@dynamong/animate-on-scroll';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-animate-on-scroll-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAnimateOnScroll, DocPageShell],
  template: `
    <docs-page-shell
      name="AnimateOnScroll"
      description="dgAnimateOnScroll — adds an animation class when the element scrolls into view (IntersectionObserver); optional enter/leave with once=false."
    >
      <div demo class="space-y-4">
        <p class="text-sm text-text-muted">Scroll the box; each card fades up as it enters.</p>
        <div class="h-64 space-y-24 overflow-y-auto rounded-md border border-border p-6">
          <div class="pt-40 text-center text-xs text-text-muted">keep scrolling ↓</div>
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
        &lt;div dgAnimateOnScroll enterClass="fade-in-up"&gt; ... &lt;/div&gt;
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
            <td class="py-2 pr-4 font-mono">enterClass</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">required</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">leaveClass</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">threshold</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">0.1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">once</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">dgAnimateOnScrollDisabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class AnimateOnScrollDocPage {}
