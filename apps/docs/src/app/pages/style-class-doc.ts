import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoStyleClass } from '@dynamong/style-class';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-style-class-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoStyleClass, DocPageShell],
  template: `
    <docs-page-shell
      name="StyleClass"
      description="dgStyleClass — on click, toggles / swaps CSS classes on a target element resolved by selector or the @next/@parent/@prev/@grandparent keywords."
    >
      <div demo class="space-y-4">
        <div class="space-y-2">
          <button
            type="button"
            dgStyleClass="@next"
            toggleClass="hidden"
            class="rounded-md border border-border px-3 py-1 text-sm"
          >
            Toggle panel (@next)
          </button>
          <div class="rounded-md bg-surface-100 p-4 text-sm">
            I appear and disappear — my <code class="font-mono">hidden</code> class is toggled.
          </div>
        </div>

        <div class="space-y-2">
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
      </div>
      <div code>
        &lt;button dgStyleClass="@next" toggleClass="hidden"&gt;Toggle&lt;/button&gt;
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
            <td class="py-2 pr-4 font-mono">dgStyleClass</td>
            <td class="py-2 pr-4 font-mono">
              CSS selector | '&#64;next' | '&#64;prev' | '&#64;parent' |
              '&#64;grandparent'
            </td>
            <td class="py-2 font-mono">required</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">toggleClass</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">enterClass / leaveClass</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">hideOnOutsideClick</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class StyleClassDocPage {}
