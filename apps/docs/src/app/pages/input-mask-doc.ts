import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoInputMask } from '@dynamong/input-mask';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'phone', title: 'Phone' },
  { id: 'date', title: 'Date' },
];

const API: ApiTableRow[] = [
  { name: 'mask', type: 'string', default: 'required' },
  { name: 'placeholder', type: 'string', default: "''" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'invalid', type: 'boolean', default: 'false' },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
];

@Component({
  selector: 'docs-input-mask-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoInputMask,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Input Mask"
      description="A masked text input that enforces a fixed character pattern as the user types — literal characters auto-insert, backspace/delete skip over them, and paste re-applies the mask."
      [examples]="examples"
    >
      <docs-example
        exampleId="phone"
        title="Phone"
        description="9 = a required digit; ( ) - are literals that auto-insert as you type."
      >
        <div preview class="max-w-xs">
          <dg-input-mask
            [formControl]="phone"
            mask="(999) 999-9999"
            ariaLabel="Phone number"
            placeholder="(555) 000-0000"
          />
          <p class="mt-2 text-sm text-text-muted">
            Value: <span class="font-mono">{{ phone.value || '(none)' }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-input-mask [formControl]="phone" mask="(999) 999-9999" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="date"
        title="Date"
        description="Any mask pattern works — here a fixed MM/DD/YYYY numeric date."
      >
        <div preview class="max-w-xs">
          <dg-input-mask
            [formControl]="date"
            mask="99/99/9999"
            ariaLabel="Date"
            placeholder="MM/DD/YYYY"
          />
        </div>
        <div code>&lt;dg-input-mask [formControl]="date" mask="99/99/9999" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class InputMaskDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly phone = new FormControl<string | null>(null);
  protected readonly date = new FormControl<string | null>(null);
}
