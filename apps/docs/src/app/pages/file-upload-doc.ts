import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoFileUpload } from '@dynamong/file-upload';
import type { DynamoFileRejection } from '@dynamong/file-upload';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'single', title: 'Single File' },
  { id: 'no-preview', title: 'No Preview' },
];

const API: ApiTableRow[] = [
  { name: 'value', type: 'File[] (model)', default: '[]' },
  { name: 'multiple', type: 'boolean', default: 'false' },
  { name: 'accept', type: 'string | undefined', default: 'undefined' },
  { name: 'maxFileSize', type: 'number | undefined', default: 'undefined' },
  { name: 'maxFiles', type: 'number | undefined', default: 'undefined' },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  {
    name: 'label',
    type: 'string',
    default: "'Drag and drop files here, or click to browse'",
  },
  { name: 'showPreview', type: 'boolean', default: 'true' },
];

@Component({
  selector: 'docs-file-upload-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoFileUpload, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="File Upload"
      description="A drag-and-drop and click-to-browse file input with validation and a removable file list."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="multiple with accept and maxFileSize validation; (rejected) reports files that failed a rule. Picking an image file shows a small thumbnail preview automatically."
      >
        <div preview class="max-w-md">
          <dg-file-upload
            [(value)]="files"
            [multiple]="true"
            accept="image/*,.pdf"
            [maxFileSize]="fiveMB"
            ariaLabel="Attachments"
            (rejected)="rejections.set($event)"
          />
          @if (rejections().length > 0) {
            <p class="mt-2 text-sm text-danger">
              {{ rejections().length }} file(s) rejected.
            </p>
          }
        </div>
        <div code>
          &lt;dg-file-upload [(value)]="files" [multiple]="true"
          accept="image/*,.pdf" [maxFileSize]="5 * 1024 * 1024" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="single"
        title="Single File"
        description="Without multiple, picking a new file replaces the current one."
      >
        <div preview class="max-w-md">
          <dg-file-upload [(value)]="oneFile" ariaLabel="Avatar" />
        </div>
        <div code>&lt;dg-file-upload [(value)]="file" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="no-preview"
        title="No Preview"
        description="showPreview disables the automatic image thumbnail, showing only the file name and size."
      >
        <div preview class="max-w-md">
          <dg-file-upload
            [(value)]="noPreviewFiles"
            [multiple]="true"
            accept="image/*"
            [showPreview]="false"
            ariaLabel="Attachments (no preview)"
          />
        </div>
        <div code>
          &lt;dg-file-upload [(value)]="files" [showPreview]="false" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class FileUploadDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly fiveMB = 5 * 1024 * 1024;
  protected readonly files = signal<File[]>([]);
  protected readonly oneFile = signal<File[]>([]);
  protected readonly rejections = signal<DynamoFileRejection[]>([]);
  protected readonly noPreviewFiles = signal<File[]>([]);
}
