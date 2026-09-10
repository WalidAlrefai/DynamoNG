import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoInplace } from '@dynamong/inplace';
import { DynamoInputText } from '@dynamong/input-text';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

@Component({
  selector: 'docs-inplace-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoInplace,
    DynamoInputText,
    FormsModule,
    DocExamplesLayout,
    DocExample,
  ],
  template: `
    <docs-examples-layout
      name="Inplace"
      description="Click-to-edit: a compact display region that swaps to an editor region on click, with Escape and a close button to dismiss."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Project a [display] and an [editor] slot; clicking the display enters edit mode and moves focus into the editor. Escape or × returns."
      >
        <div preview class="space-y-2">
          <p class="text-sm text-text-muted">Project name</p>
          <dg-inplace>
            <span display>{{ name() || 'Untitled project' }}</span>
            <dg-input-text
              editor
              size="sm"
              [(ngModel)]="draft"
              ariaLabel="Project name"
            />
          </dg-inplace>
          <p class="text-xs text-text-muted">
            Draft: <span class="font-mono">{{ draft() }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-inplace&gt; &lt;span display&gt;&#123;&#123; name()
          &#125;&#125;&lt;/span&gt; &lt;dg-input-text editor
          [(ngModel)]="draft" /&gt; &lt;/dg-inplace&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-text-muted">
              <th class="py-2 pr-4">Input / Slot</th>
              <th class="py-2 pr-4">Type</th>
              <th class="py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">active</td>
              <td class="py-2 pr-4 font-mono">boolean (model)</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">disabled</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">closable</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">true</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">[display]</td>
              <td class="py-2 pr-4 font-mono">ng-content slot</td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">[editor]</td>
              <td class="py-2 pr-4 font-mono">ng-content slot</td>
              <td class="py-2 font-mono">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </docs-examples-layout>
  `,
})
export class InplaceDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly draft = signal('DynamoNG');
  protected readonly name = this.draft;
}
