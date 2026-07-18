import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoInputText } from '@dynamong/input-text';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-input-text-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoInputText, DocPageShell, FormsModule],
  template: `
    <docs-page-shell
      name="Input Text"
      description="A single-line text input with full Angular Forms (ControlValueAccessor) integration."
    >
      <div demo class="flex max-w-sm flex-col gap-3">
        <dg-input-text placeholder="Ada Lovelace" ariaLabel="Name" />
        <dg-input-text placeholder="Invalid state" [invalid]="true" ariaLabel="Invalid example" />
        <dg-input-text placeholder="Disabled" [disabled]="true" ariaLabel="Disabled example" />
      </div>
      <div code>&lt;dg-input-text [(ngModel)]="name" placeholder="Ada Lovelace" ariaLabel="Name" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">type</td>
            <td class="py-2 pr-4 font-mono">DynamoInputTextType</td>
            <td class="py-2 font-mono">'text'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">invalid</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class InputTextDocPage {}
