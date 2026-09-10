import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoInputText } from '@dynamong/input-text';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
];

@Component({
  selector: 'docs-input-text-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoInputText, FormsModule, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Input Text"
      description="A single-line text input with full Angular Forms (ControlValueAccessor) integration."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind with ngModel or a FormControl; pass an ariaLabel when there's no visible <label>."
        [code]="basicCode"
      >
        <div preview class="max-w-sm">
          <dg-input-text
            [(ngModel)]="name"
            placeholder="Ada Lovelace"
            ariaLabel="Name"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
        [code]="invalidCode"
      >
        <div preview class="max-w-sm">
          <dg-input-text
            placeholder="Invalid state"
            [invalid]="true"
            ariaLabel="Invalid example"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the field out and blocks input."
        [code]="disabledCode"
      >
        <div preview class="max-w-sm">
          <dg-input-text
            placeholder="Disabled"
            [disabled]="true"
            ariaLabel="Disabled example"
          />
        </div>
      </docs-example>

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
    </docs-examples-layout>
  `,
})
export class InputTextDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly name = signal('');

  protected readonly basicCode = `<dg-input-text [(ngModel)]="name" placeholder="Ada Lovelace" ariaLabel="Name" />`;
  protected readonly invalidCode = `<dg-input-text [invalid]="true" placeholder="Invalid state" ariaLabel="Name" />`;
  protected readonly disabledCode = `<dg-input-text [disabled]="true" placeholder="Disabled" ariaLabel="Name" />`;
}
