import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSpinner } from '@dynamong/spinner';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-spinner-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSpinner, DocPageShell],
  template: `
    <docs-page-shell
      name="Spinner"
      description="A small loading indicator — decorative by default, or an announced status region when given a label."
    >
      <div demo class="flex flex-wrap items-center gap-6 text-primary">
        <dg-spinner size="sm" />
        <dg-spinner size="md" />
        <dg-spinner size="lg" />
        <dg-spinner label="Loading results" />
      </div>
      <div code>&lt;dg-spinner label="Loading results" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined (decorative)</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class SpinnerDocPage {}
