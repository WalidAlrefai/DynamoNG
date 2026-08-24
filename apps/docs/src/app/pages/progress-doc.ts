import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoProgress } from '@dynamong/progress';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-progress-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoProgress, DocPageShell],
  template: `
    <docs-page-shell
      name="Progress"
      description="A determinate linear progress bar with severity-colored fill."
    >
      <div demo class="flex flex-col gap-3">
        <dg-progress [value]="30" ariaLabel="Upload progress" />
        <dg-progress
          [value]="60"
          severity="success"
          ariaLabel="Upload progress"
        />
        <dg-progress
          [value]="90"
          severity="warning"
          size="lg"
          ariaLabel="Upload progress"
        />
      </div>
      <div code>
        &lt;dg-progress [value]="60" severity="success" ariaLabel="Upload
        progress" /&gt;
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
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">0</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">
              'primary' | 'secondary' | 'success' | 'info' | 'warning' |
              'danger'
            </td>
            <td class="py-2 font-mono">'primary'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('Progress')</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ProgressDocPage {}
