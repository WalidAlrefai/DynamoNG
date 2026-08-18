import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSwitch } from '@dynamong/switch';
import { DocPageShell } from '../components/doc-page-shell';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import switchApiRows from '../generated/api/switch.json';

@Component({
  selector: 'docs-switch-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSwitch, DocPageShell, DocApiTable],
  template: `
    <docs-page-shell
      name="Switch"
      description="A boolean on/off toggle control."
    >
      <div demo class="flex flex-col gap-3">
        <dg-switch [checked]="true">Enable notifications</dg-switch>
        <dg-switch size="sm">Small</dg-switch>
        <dg-switch size="lg">Large</dg-switch>
        <dg-switch [disabled]="true">Disabled option</dg-switch>
      </div>
      <div code>
        &lt;dg-switch [(checked)]="enabled"&gt;Enable
        notifications&lt;/dg-switch&gt;
      </div>
      <docs-api-table api [rows]="apiRows" />
    </docs-page-shell>
  `,
})
export class SwitchDocPage {
  protected readonly apiRows: ApiTableRow[] = switchApiRows;
}
