import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSplitButton } from '@dynamong/split-button';
import { DynamoMenuItem } from '@dynamong/menu';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-split-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSplitButton, DynamoMenuItem, DocPageShell],
  template: `
    <docs-page-shell
      name="Split Button"
      description="A primary action button with an attached dropdown of secondary actions."
    >
      <div demo>
        <dg-split-button
          label="Save"
          (action)="lastAction.set('save')"
          (itemSelect)="lastAction.set($event)"
        >
          <dg-menu-item value="save-as" label="Save as..." />
          <dg-menu-item value="duplicate" label="Duplicate" />
          <dg-menu-item value="delete" label="Delete" [disabled]="true" />
        </dg-split-button>
        @if (lastAction(); as action) {
          <p class="mt-2 text-sm text-text-muted">
            Last action: <span class="font-mono">{{ action }}</span>
          </p>
        }
      </div>
      <div code>
        &lt;dg-split-button label="Save" (action)="onSave()"
        (itemSelect)="onSelect($event)"&gt; &lt;dg-menu-item value="save-as"
        label="Save as..." /&gt; &lt;/dg-split-button&gt;
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
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">severity / variant / size</td>
            <td class="py-2 pr-4 font-mono">same as Button</td>
            <td class="py-2 font-mono">'primary' / 'solid' / 'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">
              'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
            </td>
            <td class="py-2 font-mono">'bottom-start'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('More actions')</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class SplitButtonDocPage {
  protected readonly lastAction = signal<string | null>(null);
}
