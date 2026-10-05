import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoEditor, type DynamoEditorImageUploadFn } from '@dynamong/editor';
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
  { id: 'paste-as-plain-text', title: 'Paste as Plain Text' },
  { id: 'character-limit', title: 'Character Limit' },
  { id: 'custom-toolbar', title: 'Custom Toolbar' },
  { id: 'image-upload', title: 'Image Upload Hook' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'string (model)', default: "''" },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'invalid', type: 'boolean', default: 'false' },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'fluid', type: 'boolean', default: 'true' },
  { name: 'placeholder', type: 'string | undefined', default: 'undefined' },
  { name: 'readOnly', type: 'boolean', default: 'false' },
  { name: 'pasteAsPlainText', type: 'boolean', default: 'false' },
  { name: 'maxLength', type: 'number | undefined', default: 'undefined' },
  {
    name: 'toolbarButtons',
    type: 'readonly ToolbarItemId[] | undefined',
    default: 'undefined',
  },
  {
    name: 'onImageUpload',
    type: '((file: File) => Promise<string | null>) | undefined',
    default: 'undefined',
  },
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

      <docs-example
        exampleId="paste-as-plain-text"
        title="Paste as Plain Text"
        description="pasteAsPlainText strips all formatting from pasted content, inserting it as plain text only — useful when consumers paste from documents/web pages carrying styling you don't want to inherit."
      >
        <div preview class="max-w-lg">
          <dg-editor
            [formControl]="plainPasteControl"
            ariaLabel="Notes"
            [pasteAsPlainText]="true"
          />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" [pasteAsPlainText]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="character-limit"
        title="Character Limit"
        description="maxLength shows a current / max character count below the content region. It's a soft indicator only — typing or pasting past the limit is still allowed, the count just switches to a danger color."
      >
        <div preview class="max-w-lg">
          <dg-editor
            [formControl]="limitedControl"
            ariaLabel="Notes"
            [maxLength]="40"
          />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" [maxLength]="40" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="custom-toolbar"
        title="Custom Toolbar"
        description="toolbarButtons restricts the toolbar to a subset of its controls — useful for a lightweight comment box that only needs basic formatting. It's an inclusion filter: configured controls always render in the library's own fixed order, not the order you list them in."
      >
        <div preview class="max-w-lg">
          <dg-editor
            [formControl]="customToolbarControl"
            ariaLabel="Comment"
            [toolbarButtons]="['bold', 'italic', 'link']"
          />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" [toolbarButtons]="['bold',
          'italic', 'link']" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="image-upload"
        title="Image Upload Hook"
        description="onImageUpload intercepts the Insert Image button, letting you upload the file yourself and insert a hosted URL instead of the default base64 data URI. This demo simulates a short upload delay, then resolves a fake CDN URL — resolve null to cancel the insertion silently."
      >
        <div preview class="max-w-lg">
          <dg-editor
            [formControl]="imageUploadControl"
            ariaLabel="Notes"
            [onImageUpload]="demoImageUpload"
          />
        </div>
        <div code>
          &lt;dg-editor [formControl]="control" [onImageUpload]="myUploadFn"
          /&gt;
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
  protected readonly plainPasteControl = new FormControl('', {
    nonNullable: true,
  });
  protected readonly limitedControl = new FormControl(
    '<p>Getting close to the limit here</p>',
    { nonNullable: true },
  );
  protected readonly customToolbarControl = new FormControl(
    '<p>Nice work on this!</p>',
    { nonNullable: true },
  );
  protected readonly imageUploadControl = new FormControl('', {
    nonNullable: true,
  });

  // Demo only — simulates uploading the file, then resolves a fake hosted
  // URL instead of the default base64 data URI.
  protected readonly demoImageUpload: DynamoEditorImageUploadFn = async (
    file,
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return `https://cdn.example.com/uploads/${encodeURIComponent(file.name)}`;
  };
}
