import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoTag } from '@dynamong/tag';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-tag-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTag, DocPageShell],
  template: `
    <docs-page-shell
      name="Tag"
      description="A static, non-removable severity-colored label."
    >
      <div demo class="flex flex-wrap items-center gap-2">
        <dg-tag severity="primary">Primary</dg-tag>
        <dg-tag severity="secondary">Secondary</dg-tag>
        <dg-tag severity="success">Success</dg-tag>
        <dg-tag severity="info">Info</dg-tag>
        <dg-tag severity="warning">Warning</dg-tag>
        <dg-tag severity="danger">Danger</dg-tag>
        <dg-tag severity="primary" variant="outline">Outline</dg-tag>
        <dg-tag severity="success" size="sm">Small</dg-tag>
        <dg-tag severity="success" size="lg">Large</dg-tag>
      </div>
      <div code>&lt;dg-tag severity="info"&gt;TypeScript&lt;/dg-tag&gt;</div>
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
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">
              'primary' | 'secondary' | 'success' | 'info' | 'warning' |
              'danger'
            </td>
            <td class="py-2 font-mono">'primary'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">variant</td>
            <td class="py-2 pr-4 font-mono">'solid' | 'outline'</td>
            <td class="py-2 font-mono">'solid'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class TagDocPage {}
