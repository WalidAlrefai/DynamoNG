import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { DynamoSpinner } from '@dynamong/spinner';
import { cn } from '@dynamong/utils/class-merge';
import {
  fileUploadDropzoneStyles,
  fileUploadFileItemStyles,
  fileUploadFileListStyles,
  fileUploadFileNameStyles,
  fileUploadFileSizeStyles,
  fileUploadPreviewStyles,
  fileUploadRemoveButtonStyles,
} from './file-upload.styles';
import type {
  DynamoFileRejection,
  DynamoFileUploadPart,
} from './file-upload.types';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

// No native <input accept> filtering happens for drag-and-drop (only for the
// browse dialog), so accept is re-checked manually here for both paths —
// mirrors the native attribute's own comma-separated ".ext" / "type/subtype"
// / "type/*" semantics.
function matchesAccept(file: File, accept: string): boolean {
  const patterns = accept
    .split(',')
    .map((pattern) => pattern.trim())
    .filter(Boolean);
  if (patterns.length === 0) {
    return true;
  }
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    }
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.slice(0, -1));
    }
    return file.type === pattern;
  });
}

@Component({
  selector: 'dg-file-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSpinner],
  templateUrl: './file-upload.html',
})
export class DynamoFileUpload extends DynamoBaseComponent<DynamoFileUploadPart> {
  readonly multiple = input(false);
  readonly accept = input<string | undefined>(undefined);
  readonly maxFileSize = input<number | undefined>(undefined);
  readonly maxFiles = input<number | undefined>(undefined);
  readonly disabled = model(false);
  /** Renders a small spinner in the dropzone and makes the component fully
   *  non-interactive, like `disabled`. Never emits back — the consumer
   *  drives it (e.g. while an externally-tracked upload is in flight). */
  readonly loading = input(false);
  readonly size = input<DynamoSize>('md');
  readonly label = input('Drag and drop files here, or click to browse');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Shows a small image thumbnail (via `URL.createObjectURL`) next to each selected file whose type starts with `image/`. */
  readonly showPreview = input(true);

  /** Two-way bindable: `<dg-file-upload [(value)]="attachments">`. */
  readonly value = model<File[]>([]);
  /** Fires once per drop/browse batch that contained at least one rejected file. */
  readonly rejected = output<DynamoFileRejection[]>();

  private readonly fileInputEl =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInputEl');

  protected readonly isDragging = signal(false);

  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  protected readonly dropzoneClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          fileUploadDropzoneStyles({
            size: this.size(),
            dragging: this.isDragging(),
            disabled: this.isDisabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly fileListClasses = fileUploadFileListStyles;
  protected readonly fileItemClasses = fileUploadFileItemStyles;
  protected readonly fileNameClasses = fileUploadFileNameStyles;
  protected readonly fileSizeClasses = fileUploadFileSizeStyles;
  protected readonly removeButtonClasses = fileUploadRemoveButtonStyles;
  protected readonly previewClasses = fileUploadPreviewStyles;

  /** Lazily-created, cached by `File` reference — revoked in `removeFile()` and on destroy so a long upload session never leaks object URLs. */
  private readonly previewUrls = new Map<File, string>();

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      for (const url of this.previewUrls.values()) {
        URL.revokeObjectURL(url);
      }
      this.previewUrls.clear();
    });
  }

  protected previewUrl(file: File): string | null {
    if (!this.showPreview() || !file.type.startsWith('image/')) {
      return null;
    }
    let url = this.previewUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.previewUrls.set(file, url);
    }
    return url;
  }

  protected openBrowser(): void {
    if (this.isDisabled()) {
      return;
    }
    this.fileInputEl().nativeElement.click();
  }

  protected onDropzoneKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openBrowser();
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isDisabled()) {
      return;
    }
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.isDisabled()) {
      return;
    }
    this.handleFiles(event.dataTransfer?.files ?? null);
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFiles(input.files);
    // Reset so picking the exact same file again still fires `change`.
    input.value = '';
  }

  protected removeFile(file: File): void {
    this.value.update((files) => files.filter((f) => f !== file));
    this.revokePreview(file);
  }

  private revokePreview(file: File): void {
    const url = this.previewUrls.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrls.delete(file);
    }
  }

  protected formatSize(bytes: number): string {
    if (bytes <= 0) {
      return '0 B';
    }
    const exponent = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      BYTE_UNITS.length - 1,
    );
    const value = bytes / 1024 ** exponent;
    return `${exponent === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[exponent]}`;
  }

  private handleFiles(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const incoming = Array.from(fileList);
    const accept = this.accept();
    const maxFileSize = this.maxFileSize();
    const maxFiles = this.maxFiles();
    const existingCount = this.multiple() ? this.value().length : 0;

    const accepted: File[] = [];
    const rejections: DynamoFileRejection[] = [];

    for (const file of incoming) {
      if (accept && !matchesAccept(file, accept)) {
        rejections.push({ file, reason: 'type' });
        continue;
      }
      if (maxFileSize != null && file.size > maxFileSize) {
        rejections.push({ file, reason: 'size' });
        continue;
      }
      if (maxFiles != null && existingCount + accepted.length >= maxFiles) {
        rejections.push({ file, reason: 'count' });
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) {
      if (!this.multiple()) {
        // Single-file mode replaces the whole value — the previous file (if
        // any) is no longer referenced anywhere, so its preview URL would
        // otherwise leak.
        for (const file of this.value()) {
          this.revokePreview(file);
        }
      }
      this.value.set(
        this.multiple() ? [...this.value(), ...accepted] : accepted.slice(0, 1),
      );
    }
    if (rejections.length > 0) {
      this.rejected.emit(rejections);
    }
  }
}
