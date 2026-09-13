import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoPassword } from '@dynamong/password';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'strength-meter', title: 'Strength Meter' },
  { id: 'custom-labels', title: 'Custom Labels' },
  { id: 'no-toggle', title: 'No Toggle' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
];

@Component({
  selector: 'docs-password-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassword, FormsModule, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Password"
      description="A masked text input with a show/hide toggle and an optional password-strength meter."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="A masked input with a built-in show/hide eye toggle."
      >
        <div preview class="max-w-sm">
          <dg-password
            [(ngModel)]="password"
            placeholder="Enter a password"
            ariaLabel="Password"
          />
        </div>
        <div code>
          &lt;dg-password [(ngModel)]="password" ariaLabel="Password" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="strength-meter"
        title="Strength Meter"
        description="showStrengthMeter renders a live strength bar beneath the field."
      >
        <div preview class="max-w-sm">
          <dg-password
            [(ngModel)]="password"
            placeholder="Enter a password"
            [showStrengthMeter]="true"
            ariaLabel="Password with meter"
          />
        </div>
        <div code>
          &lt;dg-password [(ngModel)]="password" [showStrengthMeter]="true"
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="custom-labels"
        title="Custom Labels"
        description="weakLabel/mediumLabel/strongLabel override the strength meter's text, e.g. for i18n."
      >
        <div preview class="max-w-sm">
          <dg-password
            [(ngModel)]="frenchPassword"
            placeholder="Entrez un mot de passe"
            [showStrengthMeter]="true"
            weakLabel="Faible"
            mediumLabel="Moyen"
            strongLabel="Fort"
            ariaLabel="Mot de passe"
          />
        </div>
        <div code>
          &lt;dg-password [showStrengthMeter]="true" weakLabel="Faible"
          mediumLabel="Moyen" strongLabel="Fort" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="no-toggle"
        title="No Toggle"
        description="showToggle hides the show/hide eye button entirely."
      >
        <div preview class="max-w-sm">
          <dg-password
            placeholder="Enter a password"
            [showToggle]="false"
            ariaLabel="Password without toggle"
          />
        </div>
        <div code>&lt;dg-password [showToggle]="false" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
      >
        <div preview class="max-w-sm">
          <dg-password
            placeholder="Invalid state"
            [invalid]="true"
            ariaLabel="Invalid example"
          />
        </div>
        <div code>&lt;dg-password [invalid]="true" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the field out and blocks input."
      >
        <div preview class="max-w-sm">
          <dg-password
            placeholder="Disabled"
            [disabled]="true"
            ariaLabel="Disabled example"
          />
        </div>
        <div code>&lt;dg-password [disabled]="true" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">showStrengthMeter</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">
              weakLabel / mediumLabel / strongLabel
            </td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Weak' / 'Medium' / 'Strong'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showToggle</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
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
export class PasswordDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly password = signal('');
  protected readonly frenchPassword = signal('');
}
