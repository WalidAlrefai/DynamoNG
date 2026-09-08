import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoFieldset } from '@dynamong/fieldset';
import { DynamoInputText } from '@dynamong/input-text';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-fieldset-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoFieldset, DynamoInputText, DocPageShell],
  template: `
    <docs-page-shell
      name="Fieldset"
      description="A bordered, legend'd form section built on the real native <fieldset>/<legend> elements — the first component here to use them."
    >
      <div demo class="flex max-w-md flex-col gap-4">
        <dg-fieldset legend="Contact info" [collapsible]="true">
          <div class="flex flex-col gap-2">
            <dg-input-text placeholder="Name" ariaLabel="Name" />
            <dg-input-text placeholder="Email" ariaLabel="Email" />
          </div>
        </dg-fieldset>
        <dg-fieldset legend="Disabled section" [disabled]="true">
          <dg-input-text placeholder="This field is disabled for free" ariaLabel="Disabled field" />
        </dg-fieldset>
      </div>
      <div code>
        &lt;dg-fieldset legend="Contact info" [collapsible]="true"&gt;
        &lt;dg-input-text ariaLabel="Name" /&gt; &lt;/dg-fieldset&gt;
      </div>
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
            <td class="py-2 pr-4 font-mono">legend</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">collapsible</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">collapsed</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">
              false — maps to the native &lt;fieldset disabled&gt; attribute,
              disabling every descendant form control for free
            </td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class FieldsetDocPage {}
