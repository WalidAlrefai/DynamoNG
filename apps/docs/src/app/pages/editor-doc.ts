import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoEditor } from '@dynamong/editor';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'rich-formatting', title: 'Rich formatting' },
  { id: 'placeholder', title: 'Placeholder' },
  { id: 'read-only', title: 'Read-Only' },
];

const API: ApiTableRow[] = [
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'placeholder', type: 'string | undefined', default: 'undefined' },
  { name: 'readOnly', type: 'boolean', default: 'false' },
];

@Component({
  selector: 'docs-editor-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoEditor,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Editor"
      description="A contenteditable rich-text editor with a formatting toolbar for undo/redo, bold, italic, underline, alignment, headings, lists, links, and image embedding."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a FormControl holding an HTML string. Formatting uses document.execCommand — deprecated but still supported everywhere; any console notice is informational only."
      >
        <div preview class="max-w-lg">
          <dg-editor [formControl]="control" ariaLabel="Demo editor" />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" ariaLabel="Notes" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="rich-formatting"
        title="Rich formatting"
        description="Headings, alignment, undo/redo, and image embedding — all driven through document.execCommand, same as the other toolbar buttons. Images are stored as base64 data URIs directly in the HTML string (see the component README's Design notes for why)."
      >
        <div preview class="max-w-lg">
          <dg-editor [formControl]="richControl" ariaLabel="Rich content" />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" ariaLabel="Rich content" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="placeholder"
        title="Placeholder"
        description="placeholder shows via CSS whenever the content is empty — the contenteditable equivalent of a native placeholder."
      >
        <div preview class="max-w-lg">
          <dg-editor
            [formControl]="emptyControl"
            ariaLabel="Notes"
            placeholder="Write your notes here..."
          />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" placeholder="Write your notes
          here..." /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="read-only"
        title="Read-Only"
        description="readOnly keeps the content visible, focusable, and selectable, but blocks typing and toolbar commands — unlike disabled, it isn't dimmed."
      >
        <div preview class="max-w-lg">
          <dg-editor
            [formControl]="readOnlyControl"
            ariaLabel="Notes"
            [readOnly]="true"
          />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" [readOnly]="true" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class EditorDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly control = new FormControl('<p>Hello <b>world</b></p>', {
    nonNullable: true,
  });
  protected readonly richControl = new FormControl(
    '<h1>Heading</h1><p>Some <b>rich</b> content.</p>',
    { nonNullable: true },
  );
  protected readonly emptyControl = new FormControl('', {
    nonNullable: true,
  });
  protected readonly readOnlyControl = new FormControl(
    '<p>This content cannot be edited.</p>',
    { nonNullable: true },
  );
}
