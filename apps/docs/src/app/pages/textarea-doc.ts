import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoTextarea, DynamoTextareaDirective } from '@dynamong/textarea';
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
  { id: 'filled', title: 'Filled' },
  { id: 'fluid', title: 'Fluid' },
  { id: 'cols', title: 'Cols' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'readonly', title: 'Read-only' },
  { id: 'accessibility', title: 'Accessibility' },
];

@Component({
  selector: 'docs-textarea-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoTextarea,
    DynamoTextareaDirective,
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
        exampleId="filled"
        title="Filled"
        description='variant "filled" swaps the outlined look for a filled surface background.'
        [code]="filledCode"
      >
        <div preview class="max-w-sm">
          <dg-textarea
            variant="filled"
            placeholder="Filled"
            ariaLabel="Filled example"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="fluid"
        title="Fluid"
        description="fluid defaults true (fills its container); set false for intrinsic, content-driven width."
        [code]="fluidCode"
      >
        <div
          preview
          class="flex flex-col gap-3 max-w-sm rounded-lg border border-border p-4"
        >
          <div>
            <p class="mb-1 text-xs text-text-muted">fluid (default)</p>
            <dg-textarea ariaLabel="Fluid" placeholder="Fills container" />
          </div>
          <div>
            <p class="mb-1 text-xs text-text-muted">[fluid]="false"</p>
            <dg-textarea
              [fluid]="false"
              ariaLabel="Not fluid"
              placeholder="Intrinsic"
            />
          </div>
        </div>
      </docs-example>

      <docs-example
        exampleId="cols"
        title="Cols"
        description="cols mirrors rows — sets the native cols attribute for an intrinsic character width."
        [code]="colsCode"
      >
        <div preview>
          <dg-textarea
            [fluid]="false"
            [cols]="30"
            placeholder="30 columns wide"
            ariaLabel="Cols example"
          />
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

      <section id="accessibility" class="space-y-3">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Accessibility
        </h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-text-primary">
          <li>
            Renders a native <code class="font-mono">&lt;textarea&gt;</code>,
            inheriting its keyboard and text-editing semantics for free.
          </li>
          <li>
            <code class="font-mono">aria-invalid</code> is set while
            <code class="font-mono">invalid</code> is true,
            <code class="font-mono">aria-readonly</code> while
            <code class="font-mono">readOnly</code> is true.
          </li>
          <li>
            Always pair with an accessible name — a visible
            <code class="font-mono">&lt;label&gt;</code>, or
            <code class="font-mono">ariaLabel</code> when there's no visible
            one.
          </li>
          <li>
            <code class="font-mono">ariaDescribedby</code> associates an
            external help/error message's <code class="font-mono">id</code>.
          </li>
        </ul>

        <p class="text-sm text-text-muted">
          Already own the
          <code class="font-mono">&lt;textarea&gt;</code> element — a form built
          with strict layout selectors, or migrating existing markup? Use the
          <code class="font-mono">dgTextarea</code> directive instead of
          <code class="font-mono">&lt;dg-textarea&gt;</code> — it applies the
          exact same classes (plus its own
          <code class="font-mono">autoResize</code>
          behavior) directly to an element you already own, with no
          <code class="font-mono">&lt;dg-textarea&gt;</code> host tag around it.
        </p>
        <div class="max-w-sm rounded-lg border border-border p-4">
          <textarea
            dgTextarea
            [autoResize]="true"
            aria-label="Coupon notes"
            placeholder="Coupon notes"
            rows="2"
          ></textarea>
        </div>
        <div class="rounded-md bg-surface-100 p-3 text-sm font-mono">
          &lt;textarea dgTextarea [autoResize]="true" aria-label="Coupon notes"
          /&gt;
        </div>
      </section>

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
  protected readonly filledCode = `<dg-textarea variant="filled" placeholder="Filled" ariaLabel="Bio" />`;
  protected readonly fluidCode = `<dg-textarea [fluid]="false" placeholder="Intrinsic" ariaLabel="Bio" />`;
  protected readonly colsCode = `<dg-textarea [fluid]="false" [cols]="30" placeholder="30 columns wide" ariaLabel="Bio" />`;
  protected readonly invalidCode = `<dg-textarea [invalid]="true" placeholder="Invalid state" ariaLabel="Bio" />`;
  protected readonly disabledCode = `<dg-textarea [disabled]="true" placeholder="Disabled" ariaLabel="Bio" />`;
  protected readonly readonlyCode = `<dg-textarea value="This text can't be edited" [readOnly]="true" ariaLabel="Bio" />`;
}
