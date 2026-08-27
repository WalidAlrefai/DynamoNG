import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoPassword } from '@dynamong/password';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-password-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassword, DocPageShell, FormsModule],
  template: `
    <docs-page-shell
      name="Password"
      description="A masked text input with a show/hide toggle and an optional password-strength meter."
    >
      <div demo class="flex max-w-sm flex-col gap-4">
        <dg-password
          [(ngModel)]="password"
          placeholder="Enter a password"
          [showStrengthMeter]="true"
          ariaLabel="Password"
        />
        <dg-password placeholder="Invalid state" [invalid]="true" ariaLabel="Invalid example" />
        <dg-password placeholder="Disabled" [disabled]="true" ariaLabel="Disabled example" />
      </div>
      <div code>&lt;dg-password [(ngModel)]="password" [showStrengthMeter]="true" ariaLabel="Password" /&gt;</div>
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
    </docs-page-shell>
  `,
})
export class PasswordDocPage {
  protected readonly password = signal('');
}
