import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DynamoPicklist } from '@dynamong/picklist';
import type { DynamoSelectOption } from '@dynamong/picklist';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-picklist-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPicklist, DocPageShell],
  template: `
    <docs-page-shell
      name="PickList"
      description="A dual-list transfer widget — move items between an available and a selected list via buttons, drag-and-drop, or keyboard reorder controls."
    >
      <div demo class="flex flex-col gap-3">
        <dg-picklist [(source)]="available" [(target)]="selected" sourceLabel="Available" targetLabel="Selected" />
        <p class="text-sm text-text-muted">
          Selected: <span class="font-mono">{{ selectedLabels() || '(none)' }}</span>
        </p>
      </div>
      <div code>&lt;dg-picklist [(source)]="available" [(target)]="selected" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">source</td>
            <td class="py-2 pr-4 font-mono">DynamoSelectOption[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">target</td>
            <td class="py-2 pr-4 font-mono">DynamoSelectOption[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">sourceLabel / targetLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Available' / 'Selected'</td>
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
export class PicklistDocPage {
  protected readonly available = signal<DynamoSelectOption<string>[]>([
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'Python', value: 'py' },
    { label: 'Kotlin', value: 'kotlin', disabled: true },
  ]);
  protected readonly selected = signal<DynamoSelectOption<string>[]>([
    { label: 'TypeScript', value: 'ts' },
  ]);

  protected readonly selectedLabels = computed(() => this.selected().map((o) => o.label).join(', '));
}
