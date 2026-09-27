import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — file-upload.html only ever binds `[class]="...Classes()"`.
export const fileUploadDropzoneStyles = cva(
  'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed ' +
    'border-border text-center transition-colors ' +
    focusRingClass,
  {
    variants: {
      size: {
        sm: 'p-4 text-xs',
        md: 'p-6 text-sm',
        lg: 'p-8 text-base',
      },
      dragging: {
        true: 'border-primary bg-primary/5',
        false: 'cursor-pointer',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: '',
      },
    },
    defaultVariants: { size: 'md', dragging: false, disabled: false },
  },
);

export const fileUploadFileListStyles = 'mt-3 flex flex-col gap-2';

export const fileUploadFileItemStyles =
  'flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm';

// Fixed small square — matches the file item row's own height rather than
// scaling with the (arbitrary, per-file) source image's aspect ratio.
export const fileUploadPreviewStyles =
  'h-8 w-8 shrink-0 rounded-sm object-cover';

// The file item's own name+size (still direct children of this wrapper, now
// one level deeper than before) sit in a header row; a progress bar or error
// line, when `fileStatus` reports one, renders as a second row beneath it —
// hence a column here rather than the item's own flat row.
export const fileUploadFileInfoStyles = 'flex min-w-0 flex-1 flex-col gap-1';
export const fileUploadFileHeaderStyles = 'flex items-center gap-2';

export const fileUploadFileNameStyles = 'min-w-0 flex-1 truncate';

export const fileUploadFileSizeStyles = 'shrink-0 text-xs text-text-muted';

// --- v2: per-file progress/status (opt-in via `fileStatus`) ---

export const fileUploadProgressTrackStyles =
  'h-1 w-full overflow-hidden rounded-full bg-surface-200';
export const fileUploadProgressFillStyles =
  'h-full rounded-full bg-primary transition-[width] duration-200';
export const fileUploadStatusIconStyles = 'h-4 w-4 shrink-0 text-success';
export const fileUploadErrorTextStyles = 'text-xs text-danger';

// Mirrors chip's remove-button shape (`chipRemoveButtonStyles`) — not
// imported directly since Chip doesn't export it from its public entry
// point (feedback domain, no cross-domain reuse precedent for it yet).
export const fileUploadRemoveButtonStyles =
  '-me-1 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 ' +
  'transition-colors hover:bg-surface-200 ' +
  focusRingClass;
