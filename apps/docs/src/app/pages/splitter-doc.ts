import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSplitter, DynamoSplitterPanel } from '@dynamong/splitter';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-splitter-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSplitter, DynamoSplitterPanel, DocPageShell],
  template: `
    <docs-page-shell
      name="Splitter"
      description="A resizable multi-pane layout container with draggable dividers."
    >
      <div demo class="h-64 rounded-md border border-border">
        <dg-splitter styleClass="h-full">
          <dg-splitter-panel [initialSize]="25" [minSize]="10">
            <div class="flex h-full items-center justify-center bg-surface-100 p-4">
              Sidebar
            </div>
          </dg-splitter-panel>
          <dg-splitter-panel [minSize]="20">
            <div class="flex h-full items-center justify-center bg-surface-0 p-4">
              Main content
            </div>
          </dg-splitter-panel>
          <dg-splitter-panel [initialSize]="25" [minSize]="10">
            <div class="flex h-full items-center justify-center bg-surface-100 p-4">
              Details
            </div>
          </dg-splitter-panel>
        </dg-splitter>
      </div>
      <div code>&lt;dg-splitter&gt;
  &lt;dg-splitter-panel [initialSize]="25"&gt;Sidebar&lt;/dg-splitter-panel&gt;
  &lt;dg-splitter-panel&gt;Main content&lt;/dg-splitter-panel&gt;
&lt;/dg-splitter&gt;</div>
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
            <td class="py-2 pr-4 font-mono">orientation</td>
            <td class="py-2 pr-4 font-mono">'horizontal' | 'vertical'</td>
            <td class="py-2 font-mono">'horizontal'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">gutterSize</td>
            <td class="py-2 pr-4 font-mono">number (px)</td>
            <td class="py-2 font-mono">8</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class SplitterDocPage {}
