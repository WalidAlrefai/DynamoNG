import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoDivider } from '@dynamong/divider';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-divider-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoDivider, DocPageShell],
  template: `
    <docs-page-shell
      name="Divider"
      description="A horizontal or vertical rule, optionally with a centered label."
    >
      <div demo class="flex flex-col gap-4">
        <dg-divider />
        <dg-divider>OR</dg-divider>
        <div class="flex h-8 items-center gap-3">
          <span class="text-text-primary">Left</span>
          <dg-divider orientation="vertical" />
          <span class="text-text-primary">Right</span>
        </div>
      </div>
      <div code>&lt;dg-divider&gt;OR&lt;/dg-divider&gt;</div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-2 pr-4 font-mono">orientation</td>
            <td class="py-2 pr-4 font-mono">'horizontal' | 'vertical'</td>
            <td class="py-2 font-mono">'horizontal'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class DividerDocPage {}
