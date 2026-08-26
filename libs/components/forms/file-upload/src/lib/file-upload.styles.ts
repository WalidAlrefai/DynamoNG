import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — file-upload.html only ever binds `[class]="...Classes()"`.
export const fileUploadDropzoneStyles = cva(
  'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed ' +
    'border-border text-center transition-colors focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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

export const fileUploadFileNameStyles = 'min-w-0 flex-1 truncate';

export const fileUploadFileSizeStyles = 'shrink-0 text-xs text-muted-foreground';

// Mirrors chip's remove-button shape (`chipRemoveButtonStyles`) — not
// imported directly since Chip doesn't export it from its public entry
// point (feedback domain, no cross-domain reuse precedent for it yet).
export const fileUploadRemoveButtonStyles =
  '-mr-1 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 ' +
  'transition-colors hover:bg-surface-200 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-1';
