import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoFloatLabel, DynamoIftaLabel } from '@dynamong/float-label';
import { DynamoInputText } from '@dynamong/input-text';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-float-label-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoFloatLabel,
    DynamoIftaLabel,
    DynamoInputText,
    FormsModule,
    DocPageShell,
  ],
  template: `
    <docs-page-shell
      name="Float Label"
      description="Label wrappers for any form control — FloatLabel floats the label on focus or fill; IftaLabel pins an always-visible label inside the field."
    >
      <div demo class="flex max-w-xs flex-col gap-6">
        <dg-float-label label="Name (over)" variant="over">
          <dg-input-text [(ngModel)]="name" placeholder=" " ariaLabel="Name" />
        </dg-float-label>
        <dg-float-label label="Email (in)" variant="in">
          <dg-input-text [(ngModel)]="email" placeholder=" " ariaLabel="Email" />
        </dg-float-label>
        <dg-float-label label="Company (on)" variant="on">
          <dg-input-text
            [(ngModel)]="company"
            placeholder=" "
            ariaLabel="Company"
          />
        </dg-float-label>
        <dg-ifta-label label="Phone (IftaLabel)">
          <dg-input-text [(ngModel)]="phone" placeholder=" " ariaLabel="Phone" />
        </dg-ifta-label>
      </div>
      <div code>
        &lt;dg-float-label label="Name"&gt; &lt;dg-input-text placeholder=" " /&gt;
        &lt;/dg-float-label&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Component / Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">FloatLabel.label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">FloatLabel.variant</td>
            <td class="py-2 pr-4 font-mono">'over' | 'in' | 'on'</td>
            <td class="py-2 font-mono">'over'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">IftaLabel.label</td>
            <td class="py-2 pr-4 font-mono">string (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        The wrapped control must carry a <code class="font-mono">placeholder</code> (a single space is
        fine) so the filled state resolves via <code class="font-mono">:placeholder-shown</code> —
        the same requirement as PrimeNG's FloatLabel. Association is implicit: the control sits
        inside the <code class="font-mono">&lt;label&gt;</code>.
      </p>
    </docs-page-shell>
  `,
})
export class FloatLabelDocPage {
  protected name = '';
  protected email = '';
  protected company = 'Acme';
  protected phone = '';
}
