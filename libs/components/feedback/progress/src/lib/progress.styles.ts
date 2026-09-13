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
        // Fallback when an explicit `color` is set — the inline style wins,
        // mirroring `DynamoMeterGroup`'s own `meterGroupSegmentStyles`.
        none: '',
      },
      // No custom keyframes anywhere in this repo for a sliding indeterminate
      // bar — `animate-pulse` + `motion-reduce:animate-none` is the same
      // established pairing Skeleton uses for its own loading indicator.
      indeterminate: {
        true: 'w-full animate-pulse motion-reduce:animate-none',
        false: '',
      },
    },
    defaultVariants: { severity: 'primary', indeterminate: false },
  },
);
