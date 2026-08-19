import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — toast-container.html only ever binds `[class]="...Classes()"`.
export const toastContainerStyles = 'flex flex-col gap-2';

export const toastCardStyles = cva(
  'flex items-start gap-3 rounded-md border-l-4 bg-surface-0 p-4 text-sm text-text-primary shadow-lg',
  {
    variants: {
      severity: {
        primary: 'border-primary',
        secondary: 'border-secondary',
        success: 'border-success',
        info: 'border-info',
        warning: 'border-warning',
        danger: 'border-danger',
      },
    },
    defaultVariants: { severity: 'info' },
  },
);

export const toastIconStyles = cva('mt-0.5 h-5 w-5 shrink-0', {
  variants: {
    severity: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-success',
      info: 'text-info',
      warning: 'text-warning',
      danger: 'text-danger',
    },
  },
  defaultVariants: { severity: 'info' },
});

export const toastTitleStyles = 'font-medium text-text-primary';
export const toastMessageStyles = 'text-text-muted';

export const toastCloseButtonStyles =
  'ml-auto shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-100 ' +
  'hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
