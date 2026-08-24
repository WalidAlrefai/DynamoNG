import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — progress.html only ever binds `[class]="...Classes()"`, with
// one deliberate exception: the fill's `width` is a continuous 0-100 value,
// which no discrete class variant can express, so progress.html binds
// `[style.width.%]` directly instead. Everything else about the fill
// (height, color, rounding, transition) still comes from progressFillStyles.
export const progressTrackStyles = cva(
  'w-full overflow-hidden rounded-full bg-surface-200',
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-2.5',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const progressFillStyles = cva(
  'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
  {
    variants: {
      severity: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-success',
        info: 'bg-info',
        warning: 'bg-warning',
        danger: 'bg-danger',
      },
    },
    defaultVariants: { severity: 'primary' },
  },
);
