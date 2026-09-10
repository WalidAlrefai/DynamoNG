import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoOtpInput } from '@dynamong/otp-input';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'length', title: 'Custom Length' },
];

@Component({
  selector: 'docs-otp-input-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOtpInput, ReactiveFormsModule, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="OTP Input"
      description="A segmented one-time-code input with auto-advance, backspace-to-previous, and paste support."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a FormControl. Typing auto-advances; pasting a full code fills every box."
      >
        <div preview class="flex flex-col gap-3">
          <dg-otp-input [formControl]="code" ariaLabel="Verification code" />
          <p class="text-sm text-text-muted">
            Value: <span class="font-mono">{{ code.value || '(empty)' }}</span>
          </p>
        </div>
        <div code>&lt;dg-otp-input [formControl]="code" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="length"
        title="Custom Length"
        description="length sets the number of boxes; numeric=false allows alphanumeric characters."
      >
        <div preview>
          <dg-otp-input
            [formControl]="shortCode"
            [length]="4"
            [numeric]="false"
            ariaLabel="Short code"
          />
        </div>
        <div code>
          &lt;dg-otp-input [formControl]="code" [length]="4" [numeric]="false"
          /&gt;
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
            <td class="py-2 pr-4 font-mono">length</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">6</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">numeric</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
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
export class OtpInputDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly code = new FormControl('', { nonNullable: true });
  protected readonly shortCode = new FormControl('', { nonNullable: true });
}
