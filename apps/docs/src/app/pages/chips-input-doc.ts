import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoChipsInput } from '@dynamong/chips-input';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'max', title: 'Max Count' },
  { id: 'separator', title: 'Custom Separator' },
];

const API: ApiTableRow[] = [
  { name: 'placeholder', type: 'string', default: "''" },
  { name: 'max', type: 'number | undefined', default: 'undefined' },
  { name: 'allowDuplicates', type: 'boolean', default: 'false' },
  { name: 'separator', type: 'string', default: "','" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
];

@Component({
  selector: 'docs-chips-input-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoChipsInput,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Chips Input"
      description="A tag/multi-value text input with Enter-to-commit, backspace-to-remove, and paste-splitting."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a string[] FormControl. Enter commits a chip, Backspace on an empty field removes the last one."
      >
        <div preview class="max-w-md">
          <dg-chips-input
            [formControl]="tags"
            placeholder="Add a tag..."
            ariaLabel="Tags"
          />
          <p class="mt-2 text-sm text-text-muted">
            Value:
            <span class="font-mono">{{
              tags.value.join(', ') || '(none)'
            }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-chips-input [formControl]="tags" placeholder="Add a tag..."
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="max"
        title="Max Count"
        description="max caps the number of chips; the field stops accepting input once the cap is reached."
      >
        <div preview class="max-w-md">
          <dg-chips-input
            [formControl]="capped"
            [max]="3"
            placeholder="Up to 3 tags"
            ariaLabel="Capped tags"
          />
        </div>
        <div code>&lt;dg-chips-input [formControl]="tags" [max]="3" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="separator"
        title="Custom Separator"
        description="separator changes which character commits the draft (on keypress and multi-value paste) instead of a comma."
      >
        <div preview class="max-w-md">
          <dg-chips-input
            [formControl]="semicolonSeparated"
            separator=";"
            placeholder="Type a value then press ;"
            ariaLabel="Semicolon-separated tags"
          />
        </div>
        <div code>
          &lt;dg-chips-input [formControl]="tags" separator=";" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ChipsInputDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly tags = new FormControl<string[]>(['angular', 'tailwind'], {
    nonNullable: true,
  });
  protected readonly capped = new FormControl<string[]>(['one'], {
    nonNullable: true,
  });
  protected readonly semicolonSeparated = new FormControl<string[]>([], {
    nonNullable: true,
  });
}
