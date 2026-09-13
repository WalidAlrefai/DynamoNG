import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoTextarea } from '@dynamong/textarea';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';
import textareaApiRows from '../generated/api/textarea.json';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'auto-resize', title: 'Auto Resize' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'readonly', title: 'Read-only' },
];

@Component({
  selector: 'docs-textarea-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoTextarea,
    FormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Textarea"
      description="A multi-line text input with full Angular Forms (ControlValueAccessor) integration."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind with ngModel or a FormControl like any CVA control."
        [code]="basicCode"
      >
        <div preview class="max-w-sm">
          <dg-textarea
            [(ngModel)]="bio"
            placeholder="Tell us about yourself"
            ariaLabel="Bio"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="auto-resize"
        title="Auto Resize"
        description="Set autoResize to grow the field to fit its content as you type."
        [code]="autoResizeCode"
      >
        <div preview class="max-w-sm">
          <dg-textarea
            placeholder="Grows as you type"
            [autoResize]="true"
            (resized)="resizeCount.set(resizeCount() + 1)"
            ariaLabel="Auto-resizing example"
          />
          <p class="mt-2 text-sm text-text-muted">
            resized fired {{ resizeCount() }} time(s)
          </p>
        </div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
        [code]="invalidCode"
      >
        <div preview class="max-w-sm">
          <dg-textarea
            placeholder="Invalid state"
            [invalid]="true"
            ariaLabel="Invalid example"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the field out and blocks input."
        [code]="disabledCode"
      >
        <div preview class="max-w-sm">
          <dg-textarea
            placeholder="Disabled"
            [disabled]="true"
            ariaLabel="Disabled example"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="readonly"
        title="Read-only"
        description="readOnly keeps the value visible and the field focusable, but blocks edits — unlike disabled, it isn't dimmed or removed from the tab order."
        [code]="readonlyCode"
      >
        <div preview class="max-w-sm">
          <dg-textarea
            value="This text can't be edited"
            [readOnly]="true"
            ariaLabel="Read-only example"
          />
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class TextareaDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows: ApiTableRow[] = textareaApiRows;
  protected readonly bio = signal('');
  protected readonly resizeCount = signal(0);

  protected readonly basicCode = `<dg-textarea [(ngModel)]="bio" placeholder="Tell us about yourself" ariaLabel="Bio" />`;
  protected readonly autoResizeCode = `<dg-textarea [autoResize]="true" (resized)="resizeCount.set(resizeCount() + 1)" placeholder="Grows as you type" ariaLabel="Notes" />`;
  protected readonly invalidCode = `<dg-textarea [invalid]="true" placeholder="Invalid state" ariaLabel="Bio" />`;
  protected readonly disabledCode = `<dg-textarea [disabled]="true" placeholder="Disabled" ariaLabel="Bio" />`;
  protected readonly readonlyCode = `<dg-textarea value="This text can't be edited" [readOnly]="true" ariaLabel="Bio" />`;
}
