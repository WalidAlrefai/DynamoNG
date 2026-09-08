import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoEditor } from '@dynamong/editor';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-editor-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoEditor, ReactiveFormsModule, DocPageShell],
  template: `
    <docs-page-shell
      name="Editor"
      description="A contenteditable rich-text editor with a formatting toolbar for bold, italic, underline, lists, and links."
    >
      <div demo class="max-w-lg">
        <dg-editor [formControl]="control" ariaLabel="Demo editor" />
        <p class="mt-2 text-xs text-text-muted">
          Formatting uses <code>document.execCommand</code>, which is deprecated but still
          supported by every evergreen browser — any deprecation notice you see in the console
          is informational only and doesn't affect functionality.
        </p>
      </div>
      <div code>&lt;dg-editor [formControl]="control" ariaLabel="Notes" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class EditorDocPage {
  protected readonly control = new FormControl('<p>Hello <b>world</b></p>', { nonNullable: true });
}
