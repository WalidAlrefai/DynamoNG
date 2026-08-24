import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoStep, DynamoStepper } from '@dynamong/stepper';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-stepper-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoStepper, DynamoStep, DocPageShell],
  template: `
    <docs-page-shell
      name="Stepper"
      description="A multi-step process indicator with built-in content panels and Back/Next navigation."
    >
      <div demo>
        <dg-stepper [(value)]="activeStep" ariaLabel="Checkout">
          <dg-step value="account" label="Account">
            <p class="text-text-primary">Create your account details.</p>
          </dg-step>
          <dg-step value="preferences" label="Preferences" [disabled]="true">
            <p class="text-text-primary">Optional — skipped by default.</p>
          </dg-step>
          <dg-step value="confirm" label="Confirm">
            <p class="text-text-primary">Review and confirm.</p>
          </dg-step>
        </dg-stepper>
      </div>
      <div code>
        &lt;dg-stepper [(value)]="active"&gt; &lt;dg-step value="account"
        label="Account"&gt;...&lt;/dg-step&gt; &lt;/dg-stepper&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Element</th>
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-stepper</td>
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">string | undefined (model)</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-stepper</td>
            <td class="py-2 pr-4 font-mono">backLabel / nextLabel / finishLabel</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Back' / 'Next' / 'Finish'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-stepper</td>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-step</td>
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dg-step</td>
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">dg-step</td>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class StepperDocPage {
  protected readonly activeStep = signal<string | undefined>('account');
}
