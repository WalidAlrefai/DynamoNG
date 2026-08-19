import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoBadge } from '@dynamong/badge';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-badge-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoBadge, DocPageShell],
  template: `
    <docs-page-shell
      name="Badge"
      description="A small, severity-colored label for status or metadata."
    >
      <div demo class="flex flex-wrap items-center gap-2">
        <dg-badge severity="primary">Primary</dg-badge>
        <dg-badge severity="secondary">Secondary</dg-badge>
        <dg-badge severity="success">Success</dg-badge>
        <dg-badge severity="info">Info</dg-badge>
        <dg-badge severity="warning">Warning</dg-badge>
        <dg-badge severity="danger">Danger</dg-badge>
        <dg-badge severity="primary" variant="outline">Outline</dg-badge>
        <dg-badge severity="success" size="sm">Small</dg-badge>
        <dg-badge severity="success" size="lg">Large</dg-badge>
      </div>
      <div code>&lt;dg-badge severity="success"&gt;Active&lt;/dg-badge&gt;</div>
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
export class BadgeDocPage {}
