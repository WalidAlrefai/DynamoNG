import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoTree, type DynamoTreeNode } from '@dynamong/tree';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-tree-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTree, DocPageShell],
  template: `
    <docs-page-shell
      name="Tree"
      description="A hierarchical, expandable tree with keyboard navigation and multi-select tri-state checkboxes."
    >
      <div demo>
        <dg-tree
          [items]="items()"
          [(expandedIds)]="expanded"
          [(selected)]="selected"
          ariaLabel="Project files"
        />
      </div>
      <div code>
        &lt;dg-tree [items]="items()" [(expandedIds)]="expanded"
        [(selected)]="selected" ariaLabel="Project files" /&gt;
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
            <td class="py-2 pr-4 font-mono">DynamoTreeNode[]</td>
            <td class="py-2 font-mono">required</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">expandedIds</td>
            <td class="py-2 pr-4 font-mono">string[]</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">selected</td>
            <td class="py-2 pr-4 font-mono">string[]</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class TreeDocPage {
  readonly items = signal<DynamoTreeNode[]>([
    {
      id: 'src',
      label: 'src',
      children: [
        { id: 'main', label: 'main.ts' },
        { id: 'app', label: 'app.ts' },
      ],
    },
    {
      id: 'docs',
      label: 'docs',
      children: [
        { id: 'readme', label: 'README.md' },
        { id: 'license', label: 'LICENSE', disabled: true },
      ],
    },
    { id: 'gitignore', label: '.gitignore' },
  ]);

  readonly expanded = signal<string[]>(['src']);
  readonly selected = signal<string[]>([]);
}
