import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  fileUploadDropzoneStyles,
  fileUploadFileItemStyles,
  fileUploadFileListStyles,
  fileUploadFileNameStyles,
  fileUploadFileSizeStyles,
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
  templateUrl: './file-upload.html',
})
export class DynamoFileUpload extends DynamoBaseComponent<DynamoFileUploadPart> {
  readonly multiple = input(false);
  readonly accept = input<string | undefined>(undefined);
  readonly maxFileSize = input<number | undefined>(undefined);
  readonly maxFiles = input<number | undefined>(undefined);
  readonly disabled = model(false);
  readonly size = input<DynamoSize>('md');
  readonly label = input('Drag and drop files here, or click to browse');
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Two-way bindable: `<dg-file-upload [(value)]="attachments">`. */
  readonly value = model<File[]>([]);
  /** Fires once per drop/browse batch that contained at least one rejected file. */
  readonly rejected = output<DynamoFileRejection[]>();

  private readonly fileInputEl =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInputEl');

  protected readonly isDragging = signal(false);

  protected readonly dropzoneClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          fileUploadDropzoneStyles({
            size: this.size(),
            dragging: this.isDragging(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly fileListClasses = fileUploadFileListStyles;
  protected readonly fileItemClasses = fileUploadFileItemStyles;
  protected readonly fileNameClasses = fileUploadFileNameStyles;
  protected readonly fileSizeClasses = fileUploadFileSizeStyles;
  protected readonly removeButtonClasses = fileUploadRemoveButtonStyles;

  protected openBrowser(): void {
    if (this.disabled()) {
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
    if (this.disabled()) {
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
    if (this.disabled()) {
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
      this.value.set(
        this.multiple() ? [...this.value(), ...accepted] : accepted.slice(0, 1),
      );
    }
    if (rejections.length > 0) {
      this.rejected.emit(rejections);
    }
  }
}
