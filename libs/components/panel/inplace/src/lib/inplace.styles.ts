import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — inplace.html binds `[class]="...Classes()"`.

export const inplaceRootStyles = 'inline-block';

export const inplaceDisplayStyles = cva(
  '-mx-1 rounded-sm px-1 text-start text-sm text-text-primary transition-colors ' +
    focusRingClass,
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
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-text-muted ' +
  'transition-colors hover:bg-surface-100 hover:text-text-primary ' +
  focusRingClass;
