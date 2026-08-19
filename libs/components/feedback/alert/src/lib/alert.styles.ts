import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — alert.html only ever binds `[class]="...Classes()"` or a
// plain exported string constant.
export const alertCardStyles = cva(
  'flex items-start gap-3 rounded-md border-l-4 bg-surface-0 p-4 text-sm text-text-primary',
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

export const alertIconStyles = cva('mt-0.5 h-5 w-5 shrink-0', {
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

export const alertTitleStyles = 'font-medium text-text-primary';
export const alertMessageStyles = 'text-text-muted';

export const alertCloseButtonStyles =
  'ml-auto shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-100 ' +
  'hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
