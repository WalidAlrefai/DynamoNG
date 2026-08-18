import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoTextarea } from '@dynamong/textarea';
import { DocPageShell } from '../components/doc-page-shell';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import textareaApiRows from '../generated/api/textarea.json';

@Component({
  selector: 'docs-textarea-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTextarea, DocPageShell, DocApiTable, FormsModule],
  template: `
    <docs-page-shell
      name="Textarea"
      description="A multi-line text input with full Angular Forms (ControlValueAccessor) integration."
    >
      <div demo class="flex max-w-sm flex-col gap-3">
        <dg-textarea
          [(ngModel)]="bio"
          placeholder="Tell us about yourself"
          ariaLabel="Bio"
        />
        <dg-textarea
          placeholder="Grows as you type"
          [autoResize]="true"
          ariaLabel="Auto-resizing example"
        />
        <dg-textarea
          placeholder="Invalid state"
          [invalid]="true"
          ariaLabel="Invalid example"
        />
        <dg-textarea
          placeholder="Disabled"
          [disabled]="true"
          ariaLabel="Disabled example"
        />
      </div>
      <div code>
        &lt;dg-textarea [(ngModel)]="bio" [autoResize]="true"
        ariaLabel="Bio" /&gt;
      </div>
      <docs-api-table api [rows]="apiRows" />
    </docs-page-shell>
  `,
})
export class TextareaDocPage {
  protected readonly bio = signal('');
  protected readonly apiRows: ApiTableRow[] = textareaApiRows;
}
