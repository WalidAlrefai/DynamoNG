import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — dialog.html only ever binds `[class]="...Classes()"`.
export const dialogPanelStyles = cva(
  'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-surface-0 p-6 shadow-lg ' +
    'focus:outline-none',
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
  'hover:bg-surface-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
