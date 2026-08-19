import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoCard } from '@dynamong/card';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-card-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoCard, DocPageShell],
  template: `
    <docs-page-shell
      name="Card"
      description="A content container with an optional header, body, and footer."
    >
      <div demo class="flex flex-wrap gap-4">
        <div class="w-72">
          <dg-card header="Elevated" subheader="Default shadow variant">
            <p class="text-text-primary">Card body content goes here.</p>
          </dg-card>
        </div>
        <div class="w-72">
          <dg-card
            header="Outlined"
            subheader="Bordered variant"
            variant="outlined"
          >
            <p class="text-text-primary">Card body content goes here.</p>
            <div footer>
              <dg-button size="sm">Action</dg-button>
            </div>
          </dg-card>
        </div>
        <div class="w-72">
          <dg-card header="Filled" variant="filled">
            <p class="text-text-primary">Card body content goes here.</p>
          </dg-card>
        </div>
      </div>
      <div code>
        &lt;dg-card header="Title" subheader="Subtitle"&gt; Body content &lt;div
        footer&gt;&lt;dg-button
        size="sm"&gt;Action&lt;/dg-button&gt;&lt;/div&gt; &lt;/dg-card&gt;
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
            <td class="py-2 pr-4 font-mono">header</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">subheader</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">variant</td>
            <td class="py-2 pr-4 font-mono">
              'elevated' | 'outlined' | 'filled'
            </td>
            <td class="py-2 font-mono">'elevated'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class CardDocPage {}
