import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoBreadcrumb } from '@dynamong/breadcrumb';
import type { DynamoBreadcrumbItem } from '@dynamong/breadcrumb';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-breadcrumb-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoBreadcrumb, DocPageShell],
  template: `
    <docs-page-shell
      name="Breadcrumb"
      description="A path navigation trail with a current-page indicator."
    >
      <div demo>
        <dg-breadcrumb [items]="items" />
      </div>
      <div code>
        &lt;dg-breadcrumb [items]="breadcrumbItems" /&gt;
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
            <td class="py-2 pr-4 font-mono">items</td>
            <td class="py-2 pr-4 font-mono">
              &#123; label: string; href?: string &#125;[]
            </td>
            <td class="py-2 font-mono">required</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('Breadcrumb')</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class BreadcrumbDocPage {
  protected readonly items: DynamoBreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Archived' },
    { label: 'Products', href: '/products' },
    { label: 'Keyboard' },
  ];
}
