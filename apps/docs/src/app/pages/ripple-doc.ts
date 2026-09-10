import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoRipple } from '@dynamong/ripple';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-ripple-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoRipple, DocPageShell],
  template: `
    <docs-page-shell
      name="Ripple"
      description="dgRipple — a Material-style pointer ripple animated with the Web Animations API; honours prefers-reduced-motion."
    >
      <div demo class="flex flex-wrap gap-4">
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
          class="rounded-md border border-border px-4 py-2 text-text-primary"
        >
          Outline
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
            <td class="py-2 pr-4 font-mono">dgRippleDisabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">dgRippleColor</td>
            <td class="py-2 pr-4 font-mono">string (CSS colour)</td>
            <td class="py-2 font-mono">bg-current/30</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class RippleDocPage {}
