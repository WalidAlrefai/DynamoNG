import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoFileUpload } from '@dynamong/file-upload';
import type { DynamoFileRejection } from '@dynamong/file-upload';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-file-upload-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoFileUpload, DocPageShell],
  template: `
    <docs-page-shell
      name="File Upload"
      description="A drag-and-drop and click-to-browse file input with validation and a removable file list."
    >
      <div demo class="max-w-md">
        <dg-file-upload
          [(value)]="files"
          [multiple]="true"
          accept="image/*,.pdf"
          [maxFileSize]="5 * 1024 * 1024"
          ariaLabel="Attachments"
          (rejected)="rejections.set($event)"
        />
        @if (rejections().length > 0) {
          <p class="mt-2 text-sm text-danger">
            {{ rejections().length }} file(s) rejected.
          </p>
        }
      </div>
      <div code>&lt;dg-file-upload [(value)]="files" [multiple]="true" accept="image/*,.pdf" [maxFileSize]="5 * 1024 * 1024" /&gt;</div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">File[] (model)</td>
            <td class="py-2 font-mono">[]</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">multiple</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">accept</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">maxFileSize</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">maxFiles</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">label</td>
            <td class="py-2 pr-4 font-mono">string</td>
            <td class="py-2 font-mono">'Drag and drop files here, or click to browse'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class FileUploadDocPage {
  protected readonly files = signal<File[]>([]);
  protected readonly rejections = signal<DynamoFileRejection[]>([]);
}
