import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — slider.html only ever binds `[class]="...Classes()"`, except
// the fill's `[style.width.%]` and the thumb's `[style.left.%]` (see
// slider.ts), a continuous 0-100 value with no discrete class variant that
// could express it — same "deliberate inline-style exception" pattern as
// Progress's fill-width, Tree's indent-depth, Skeleton's width/height, and
// Carousel's track transform.
export const sliderRootStyles = 'relative w-full py-2';

export const sliderTrackStyles = cva('relative w-full rounded-full bg-surface-200', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2',
    },
    disabled: {
      true: 'pointer-events-none opacity-60',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: { size: 'md', disabled: false },
});

export const sliderFillStyles = cva('absolute inset-y-0 left-0 rounded-full', {
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
});

export const sliderThumbStyles = cva(
  'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-surface-0 shadow ' +
    'transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      severity: {
        primary: 'border-primary',
        secondary: 'border-secondary',
        success: 'border-success',
        info: 'border-info',
        warning: 'border-warning',
        danger: 'border-danger',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'cursor-grab active:cursor-grabbing',
      },
    },
    defaultVariants: { size: 'md', severity: 'primary', disabled: false },
  },
);
