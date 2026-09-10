import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — meter-group.html only ever binds `[class]="...Classes()"`,
// with one deliberate exception mirroring Progress: each segment's size is a
// continuous 0-100 value bound via `[style.flex-basis.%]`, which no discrete
// class variant can express.

export const meterGroupRootStyles = cva('flex gap-3', {
  variants: {
    orientation: {
      horizontal: 'flex-col',
      vertical: 'flex-row items-start',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const meterGroupTrackStyles = cva(
  'flex overflow-hidden rounded-full bg-surface-200',
  {
    variants: {
      orientation: {
        horizontal: 'w-full flex-row',
        vertical: 'flex-col-reverse',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      { orientation: 'horizontal', size: 'sm', class: 'h-1.5' },
      { orientation: 'horizontal', size: 'md', class: 'h-2.5' },
      { orientation: 'horizontal', size: 'lg', class: 'h-3.5' },
      { orientation: 'vertical', size: 'sm', class: 'h-40 w-1.5' },
      { orientation: 'vertical', size: 'md', class: 'h-40 w-2.5' },
      { orientation: 'vertical', size: 'lg', class: 'h-40 w-3.5' },
    ],
    defaultVariants: { orientation: 'horizontal', size: 'md' },
  },
);

// The palette map is copied from `progressFillStyles` — same severity → bg
// token mapping. `none` is the fallback used when an item sets an explicit
// `color` (the inline style then wins).
export const meterGroupSegmentStyles = cva('h-full w-full', {
  variants: {
    severity: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      success: 'bg-success',
      info: 'bg-info',
      warning: 'bg-warning',
      danger: 'bg-danger',
      none: '',
    },
  },
  defaultVariants: { severity: 'primary' },
});

export const meterGroupLegendStyles =
  'flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-primary';

export const meterGroupLegendItemStyles = 'flex items-center gap-1.5';

export const meterGroupLegendMarkerStyles = cva('h-2.5 w-2.5 shrink-0 rounded-sm', {
  variants: {
    severity: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      success: 'bg-success',
      info: 'bg-info',
      warning: 'bg-warning',
      danger: 'bg-danger',
      none: '',
    },
  },
  defaultVariants: { severity: 'primary' },
});

export const meterGroupLegendValueStyles = 'text-text-muted';
