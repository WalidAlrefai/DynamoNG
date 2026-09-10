import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — inplace.html binds `[class]="...Classes()"`.

export const inplaceRootStyles = 'inline-block';

export const inplaceDisplayStyles = cva(
  '-mx-1 rounded px-1 text-left text-sm text-text-primary transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  {
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'cursor-pointer hover:bg-surface-100',
      },
    },
    defaultVariants: { disabled: false },
  },
);

export const inplaceEditorStyles = 'inline-flex items-start gap-1';

export const inplaceEditorBodyStyles = 'min-w-0';

// Small bare button — same shape as Chips Input's remove-chip button.
export const inplaceCloseButtonStyles =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted ' +
  'transition-colors hover:bg-surface-100 hover:text-text-primary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';
