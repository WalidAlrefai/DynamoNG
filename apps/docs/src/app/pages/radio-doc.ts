import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoRadio } from '@dynamong/radio';
import { DocPageShell } from '../components/doc-page-shell';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import radioApiRows from '../generated/api/radio.json';

@Component({
  selector: 'docs-radio-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoRadio, DocPageShell, DocApiTable],
  template: `
    <docs-page-shell
      name="Radio"
      description="A single-selection control among a group of native radio inputs sharing a name."
    >
      <div demo class="flex flex-col gap-1">
        <dg-radio name="plan" value="free" [checked]="plan() === 'free'" (checkedChange)="plan.set('free')">
          Free
        </dg-radio>
        <dg-radio name="plan" value="pro" [checked]="plan() === 'pro'" (checkedChange)="plan.set('pro')">
          Pro
        </dg-radio>
        <dg-radio [disabled]="true" name="plan" value="enterprise">Enterprise (disabled)</dg-radio>
      </div>
      <div code>&lt;dg-radio name="plan" value="free" [checked]="plan() === 'free'" (checkedChange)="plan.set('free')"&gt;Free&lt;/dg-radio&gt;</div>
      <docs-api-table api [rows]="apiRows" />
      <p class="mt-4 text-sm text-text-muted">
        There is no <code>RadioGroup</code> container — give sibling radios the same
        <code>name</code> for native grouping, and drive them from one shared selection signal using the
        split-binding form shown above (not full <code>[(checked)]</code>, which would desync a deselected
        sibling since native radios never fire <code>change</code> on deselection).
      </p>
    </docs-page-shell>
  `,
})
export class RadioDocPage {
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
  protected readonly apiRows: ApiTableRow[] = radioApiRows;
}
