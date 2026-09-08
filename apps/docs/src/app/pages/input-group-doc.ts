import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoInputGroup } from '@dynamong/input-group';
import { DynamoInputText } from '@dynamong/input-text';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-input-group-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoInputGroup, DynamoInputText, DocPageShell],
  template: `
    <docs-page-shell
      name="Input Group"
      description="A bordered wrapper adding prefix/suffix content — an icon, a $ sign, a unit label — alongside any projected input."
    >
      <div demo class="flex flex-col gap-3">
        <div class="w-40">
          <dg-input-group>
            <span prefix>$</span>
            <dg-input-text [unstyled]="true" styleClass="min-w-0 flex-1 bg-transparent outline-none" placeholder="0.00" ariaLabel="Amount" />
            <span suffix>USD</span>
          </dg-input-group>
        </div>
        <div class="max-w-xs">
          <dg-input-group [invalid]="true">
            <span prefix>
              <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" [attr.aria-hidden]="true">
                <path
                  d="M9 17a8 8 0 100-16 8 8 0 000 16zM19 19l-4.35-4.35"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <dg-input-text [unstyled]="true" styleClass="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search..." ariaLabel="Search" />
          </dg-input-group>
        </div>
      </div>
      <div code>
        &lt;dg-input-group&gt;
          &lt;span prefix&gt;$&lt;/span&gt;
          &lt;dg-input-text [unstyled]="true" styleClass="min-w-0 flex-1 bg-transparent outline-none" ariaLabel="Amount" /&gt;
          &lt;span suffix&gt;USD&lt;/span&gt;
        &lt;/dg-input-group&gt;
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
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">invalid</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        Every DynamoNG input already renders its own border. Pass
        <code class="font-mono">[unstyled]="true"</code> (plus enough
        <code class="font-mono">styleClass</code> to size and reset it, as
        shown above) to any input placed inside
        <code class="font-mono">&lt;dg-input-group&gt;</code> so only the
        group's own border shows — the group has no
        <code class="font-mono">disabled</code> input of its own; disable
        the projected input directly.
      </p>
    </docs-page-shell>
  `,
})
export class InputGroupDocPage {}
