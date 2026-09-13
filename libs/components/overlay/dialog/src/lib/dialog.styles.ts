import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — dialog.html only ever binds `[class]="...Classes()"`.
export const dialogPanelStyles = cva(
  'relative z-modal max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-surface-0 p-6 shadow-lg ' +
    // Always re-enables pointer events on the panel itself, since the root
    // wrapper (dialog.html) is made `pointer-events-none` while `modal` is
    // false, to let clicks reach the rest of the page around it.
    'pointer-events-auto focus:outline-none',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const dialogCloseButtonStyles =
  'inline-flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors ' +
  'hover:bg-surface-100 hover:text-text-primary ' +
  focusRingClass;
