import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoChipsInput } from '@dynamong/chips-input';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-chips-input-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoChipsInput, ReactiveFormsModule, DocPageShell],
  template: `
    <docs-page-shell
      name="Chips Input"
      description="A tag/multi-value text input with Enter-to-commit, backspace-to-remove, and paste-splitting."
    >
      <div demo class="max-w-md">
        <dg-chips-input
          [formControl]="tags"
          placeholder="Add a tag..."
          ariaLabel="Tags"
        />
        <p class="mt-2 text-sm text-text-muted">
          Value:
          <span class="font-mono">{{ tags.value.join(', ') || '(none)' }}</span>
        </p>
      </div>
      <div code>&lt;dg-chips-input [formControl]="tags" placeholder="Add a tag..." /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">placeholder</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">''</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">max</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">allowDuplicates</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
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
export class ChipsInputDocPage {
  protected readonly tags = new FormControl<string[]>(['angular', 'tailwind'], {
    nonNullable: true,
  });
}
