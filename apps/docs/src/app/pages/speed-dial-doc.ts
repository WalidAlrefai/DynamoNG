import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSpeedDial } from '@dynamong/speed-dial';
import type {
  DynamoSpeedDialAction,
  DynamoSpeedDialType,
} from '@dynamong/speed-dial';
import { DocPageShell } from '../components/doc-page-shell';

const ACTIONS: DynamoSpeedDialAction[] = [
  { label: 'Add', icon: '+' },
  { label: 'Edit', icon: '✎' },
  { label: 'Share', icon: '↗' },
  { label: 'Delete', icon: '🗑' },
];

@Component({
  selector: 'docs-speed-dial-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSpeedDial, DocPageShell],
  template: `
    <docs-page-shell
      name="SpeedDial"
      description="A floating action button that fans out action items along a line or around an arc, with roving-focus keyboard support."
    >
      <div demo class="flex min-h-[16rem] items-end gap-16 p-8">
        <dg-speed-dial [actions]="actions" type="linear" direction="up" />
        <dg-speed-dial
          [actions]="actions"
          [type]="arcType()"
          direction="up"
          [radius]="100"
        />
      </div>
      <div code>
        &lt;dg-speed-dial [actions]="actions" type="linear" direction="up" /&gt;
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
            <td class="py-2 pr-4 font-mono">actions</td>
            <td class="py-2 pr-4 font-mono">DynamoSpeedDialAction[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">direction</td>
            <td class="py-2 pr-4 font-mono">'up' | 'down' | 'left' | 'right'</td>
            <td class="py-2 font-mono">'up'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">type</td>
            <td class="py-2 pr-4 font-mono">
              'linear' | 'circle' | 'semi-circle' | 'quarter-circle'
            </td>
            <td class="py-2 font-mono">'linear'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">open</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">openOnHover</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">radius</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">90</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">actionSelect</td>
            <td class="py-2 pr-4 font-mono">output&lt;DynamoSpeedDialAction&gt;</td>
            <td class="py-2 font-mono">—</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class SpeedDialDocPage {
  protected readonly actions = ACTIONS;
  protected readonly arcType = signal<DynamoSpeedDialType>('quarter-circle');
}
