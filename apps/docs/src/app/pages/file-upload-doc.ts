import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoFileUpload } from '@dynamong/file-upload';
import type {
  DynamoFileRejection,
  DynamoFileUploadProgress,
} from '@dynamong/file-upload';
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
  { id: 'progress', title: 'Progress & Status' },
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
  {
    name: 'fileStatus',
    type: 'ReadonlyMap<File, DynamoFileUploadProgress> | undefined',
    default: 'undefined',
  },
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

      <docs-example
        exampleId="progress"
        title="Progress & Status"
        description="fileStatus (keyed by the same File objects held in value) and filesAdded are entirely consumer-driven — this simulates an upload locally with setInterval since the docs app has no real backend; a real app would report progress from HttpClient instead."
      >
        <div preview class="max-w-md">
          <dg-file-upload
            [(value)]="progressFiles"
            [multiple]="true"
            [fileStatus]="progressStatus()"
            (filesAdded)="onFilesAdded($event)"
            ariaLabel="Attachments with progress"
          />
        </div>
        <div code>
          &lt;dg-file-upload [(value)]="files" [fileStatus]="fileStatus()"
          (filesAdded)="onFilesAdded($event)" /&gt;
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

  protected readonly progressFiles = signal<File[]>([]);
  protected readonly progressStatus = signal(
    new Map<File, DynamoFileUploadProgress>(),
  );

  /** Simulated upload — a real app would report progress from its own HttpClient call instead. */
  protected onFilesAdded(newFiles: File[]): void {
    for (const file of newFiles) {
      this.setStatus(file, { status: 'uploading', progress: 0 });
      let progress = 0;
      const timer = setInterval(() => {
        progress += 20 + Math.random() * 20;
        if (progress >= 100) {
          clearInterval(timer);
          this.setStatus(
            file,
            file.name.endsWith('.exe')
              ? { status: 'error', error: 'File type not allowed by server' }
              : { status: 'success' },
          );
          return;
        }
        this.setStatus(file, { status: 'uploading', progress });
      }, 400);
    }
  }

  private setStatus(file: File, status: DynamoFileUploadProgress): void {
    this.progressStatus.update((map) => new Map(map).set(file, status));
  }
}
