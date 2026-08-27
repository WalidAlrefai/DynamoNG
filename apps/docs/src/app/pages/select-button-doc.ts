import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSelectButton } from '@dynamong/select-button';
import { DocPageShell } from '../components/doc-page-shell';

const VIEW_OPTIONS = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
  { label: 'Card', value: 'card' },
];

const TAG_OPTIONS = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Archived', value: 'archived', disabled: true },
];

@Component({
  selector: 'docs-select-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSelectButton, DocPageShell],
  template: `
    <docs-page-shell
      name="Select Button"
      description="A segmented row of buttons acting as a single- or multi-select control."
    >
      <div demo class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-sm text-text-muted">Single-select</span>
          <dg-select-button
            [options]="viewOptions"
            [(value)]="view"
            ariaLabel="View"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-text-muted">Multi-select</span>
          <dg-select-button
            [options]="tagOptions"
            [(value)]="tags"
            [multiple]="true"
            ariaLabel="Tags"
          />
        </div>
      </div>
      <div code>
        &lt;dg-select-button [options]="viewOptions" [(value)]="view"
        ariaLabel="View" /&gt;
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
            <td class="py-2 pr-4 font-mono">options</td>
            <td class="py-2 pr-4 font-mono">DynamoSelectOption[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">TValue | TValue[] | null (model)</td>
            <td class="py-2 font-mono">null</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">multiple</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">—</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class SelectButtonDocPage {
  protected readonly viewOptions = VIEW_OPTIONS;
  protected readonly tagOptions = TAG_OPTIONS;
  protected readonly view = signal<string | null>('list');
  protected readonly tags = signal<string[]>(['bug']);
}
