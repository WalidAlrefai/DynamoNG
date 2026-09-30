import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';
import checkboxApiRows from '../generated/api/checkbox.json';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'filled', title: 'Filled' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'indeterminate', title: 'Indeterminate' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'read-only', title: 'Read-Only' },
  { id: 'accessibility', title: 'Accessibility' },
];

@Component({
  selector: 'docs-checkbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCheckbox, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Checkbox"
      description="A tri-state (checked / unchecked / indeterminate) toggle control."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a boolean with [(checked)]. Projected content is the label."
        [code]="basicCode"
      >
        <div preview>
          <dg-checkbox [(checked)]="accepted">
            Accept terms and conditions
          </dg-checkbox>
        </div>
      </docs-example>

      <docs-example
        exampleId="filled"
        title="Filled"
        description='variant "filled" swaps the outlined look for a filled surface background while unchecked.'
        [code]="filledCode"
      >
        <div preview>
          <dg-checkbox variant="filled">Filled example</dg-checkbox>
        </div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
        [code]="invalidCode"
      >
        <div preview>
          <dg-checkbox [invalid]="true">Required option</dg-checkbox>
        </div>
      </docs-example>

      <docs-example
        exampleId="indeterminate"
        title="Indeterminate"
        description="Set indeterminate for a “partially selected” parent checkbox — independent of checked."
        [code]="indeterminateCode"
      >
        <div preview>
          <dg-checkbox [indeterminate]="true">
            Select all (partially selected)
          </dg-checkbox>
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the control out and blocks interaction."
        [code]="disabledCode"
      >
        <div preview>
          <dg-checkbox [disabled]="true">Disabled option</dg-checkbox>
        </div>
      </docs-example>

      <docs-example
        exampleId="read-only"
        title="Read-Only"
        description="readOnly keeps the current state visible and the input focusable, but blocks toggling — unlike disabled, it stays in the tab order and isn't dimmed."
        [code]="readOnlyCode"
      >
        <div preview>
          <dg-checkbox [checked]="true" [readOnly]="true">
            Read-only, checked
          </dg-checkbox>
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
            Renders a native
            <code class="font-mono">&lt;input type="checkbox"&gt;</code>,
            inheriting its keyboard (Space to toggle) and focus semantics for
            free.
          </li>
          <li>
            <code class="font-mono">aria-invalid</code> is set while
            <code class="font-mono">invalid</code> is true,
            <code class="font-mono">aria-readonly</code> while
            <code class="font-mono">readOnly</code> is true, and
            <code class="font-mono">aria-checked="mixed"</code> while
            <code class="font-mono">indeterminate</code> is true.
          </li>
          <li>
            Always pair with an accessible name — the projected label content,
            or <code class="font-mono">ariaLabel</code>/<code class="font-mono"
              >ariaLabelledBy</code
            >
            when there's no visible one.
          </li>
          <li>
            <code class="font-mono">ariaDescribedby</code> associates an
            external help/error message's <code class="font-mono">id</code>.
          </li>
        </ul>
      </section>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class CheckboxDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows: ApiTableRow[] = checkboxApiRows;

  protected readonly accepted = signal(true);

  protected readonly basicCode = `<dg-checkbox [(checked)]="accepted">
  Accept terms and conditions
</dg-checkbox>`;
  protected readonly filledCode = `<dg-checkbox variant="filled">Filled example</dg-checkbox>`;
  protected readonly invalidCode = `<dg-checkbox [invalid]="true">Required option</dg-checkbox>`;
  protected readonly indeterminateCode = `<dg-checkbox [indeterminate]="true">
  Select all (partially selected)
</dg-checkbox>`;
  protected readonly disabledCode = `<dg-checkbox [disabled]="true">Disabled option</dg-checkbox>`;
  protected readonly readOnlyCode = `<dg-checkbox [checked]="true" [readOnly]="true">
  Read-only, checked
</dg-checkbox>`;
}
