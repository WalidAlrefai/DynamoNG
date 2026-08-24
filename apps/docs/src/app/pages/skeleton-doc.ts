import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSkeleton } from '@dynamong/skeleton';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-skeleton-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSkeleton, DocPageShell],
  template: `
    <docs-page-shell
      name="Skeleton"
      description="An animated loading-placeholder block."
    >
      <div demo class="flex max-w-sm flex-col gap-4">
        <div class="flex items-center gap-3">
          <dg-skeleton variant="circular" />
          <div class="flex flex-1 flex-col gap-2">
            <dg-skeleton variant="text" width="60%" />
            <dg-skeleton variant="text" width="40%" />
          </div>
        </div>
        <dg-skeleton variant="rectangular" height="8rem" />
      </div>
      <div code>&lt;dg-skeleton variant="text" width="60%" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">variant</td>
            <td class="py-2 pr-4 font-mono">
              'text' | 'circular' | 'rectangular'
            </td>
            <td class="py-2 font-mono">'text'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">width</td>
            <td class="py-2 pr-4 font-mono">string | number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">height</td>
            <td class="py-2 pr-4 font-mono">string | number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class SkeletonDocPage {}
