import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DocPageShell } from '../components/doc-page-shell';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import checkboxApiRows from '../generated/api/checkbox.json';

@Component({
  selector: 'docs-checkbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCheckbox, DocPageShell, DocApiTable],
  template: `
    <docs-page-shell
      name="Checkbox"
      description="A tri-state (checked / unchecked / indeterminate) toggle control."
    >
      <div demo class="flex flex-col gap-3">
        <dg-checkbox [checked]="true">Accept terms and conditions</dg-checkbox>
        <dg-checkbox [indeterminate]="true">Select all (partially selected)</dg-checkbox>
        <dg-checkbox [disabled]="true">Disabled option</dg-checkbox>
      </div>
      <div code>&lt;dg-checkbox [(checked)]="accepted"&gt;Accept terms and conditions&lt;/dg-checkbox&gt;</div>
      <docs-api-table api [rows]="apiRows" />
    </docs-page-shell>
  `,
})
export class CheckboxDocPage {
  protected readonly apiRows: ApiTableRow[] = checkboxApiRows;
}
