import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — slider.html only ever binds `[class]="...Classes()"`, except
// the fill's `[style.width.%]` and the thumb's `[style.left.%]` (see
// slider.ts), a continuous 0-100 value with no discrete class variant that
// could express it — same "deliberate inline-style exception" pattern as
// Progress's fill-width, Tree's indent-depth, Skeleton's width/height, and
// Carousel's track transform.
export const sliderRootStyles = cva('relative', {
  variants: {
    orientation: {
      horizontal: 'py-2',
      vertical: 'inline-flex px-2',
    },
    fluid: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', fluid: true, class: 'w-full' },
    { orientation: 'horizontal', fluid: false, class: 'w-72' },
  ],
  defaultVariants: { orientation: 'horizontal', fluid: true },
});

export const sliderTrackStyles = cva('relative rounded-full bg-surface-200', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    orientation: {
      horizontal: 'w-full',
      vertical: '',
    },
    disabled: {
      true: 'pointer-events-none opacity-60',
      false: 'cursor-pointer',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', size: 'sm', class: 'h-1' },
    { orientation: 'horizontal', size: 'md', class: 'h-1.5' },
    { orientation: 'horizontal', size: 'lg', class: 'h-2' },
    { orientation: 'vertical', size: 'sm', class: 'w-1' },
    { orientation: 'vertical', size: 'md', class: 'w-1.5' },
    { orientation: 'vertical', size: 'lg', class: 'w-2' },
  ],
  defaultVariants: { size: 'md', orientation: 'horizontal', disabled: false },
});

export const sliderFillStyles = cva('absolute rounded-full', {
  variants: {
    severity: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      success: 'bg-success',
      info: 'bg-info',
      warning: 'bg-warning',
      danger: 'bg-danger',
    },
    orientation: {
      horizontal: 'inset-y-0 start-0',
      vertical: 'inset-x-0 bottom-0',
    },
  },
  defaultVariants: { severity: 'primary', orientation: 'horizontal' },
});

export const sliderThumbStyles = cva(
  'absolute rounded-full border-2 bg-surface-0 shadow transition-shadow ' +
    focusRingClass,
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
      orientation: {
        horizontal: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
        vertical: 'start-1/2 -translate-x-1/2 translate-y-1/2',
      },
    },
    defaultVariants: {
      size: 'md',
      severity: 'primary',
      disabled: false,
      orientation: 'horizontal',
    },
  },
);

// A dot per tick, positioned via the same [style] the thumb uses — offset
// to the side opposite the thumb's own axis so it never overlaps the drag
// target. No click behavior of its own; the track's existing step-snapping
// pointerdown handling already lands exactly on a tick when dragged there.
export const sliderTickStyles = cva(
  'absolute h-1 w-1 rounded-full bg-surface-400',
  {
    variants: {
      orientation: {
        horizontal: 'top-full mt-1.5 -translate-x-1/2',
        vertical: 'start-full ms-1.5 translate-y-1/2',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

// Positioned via the same [style] percentStyle() produces for the tick dot
// it labels — offset further from the track than the dot so the label
// clears it, same reasoning sliderTickStyles already has for its own offset.
export const sliderTickLabelStyles = cva(
  'absolute whitespace-nowrap text-[10px] text-text-muted',
  {
    variants: {
      orientation: {
        horizontal: 'top-full mt-4 -translate-x-1/2',
        vertical: 'start-full ms-4 translate-y-1/2',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

// Nested inside the (already percent-positioned) thumb, so it only needs a
// static offset toward the side/above it, not its own percent math.
export const sliderTooltipStyles = cva(
  'pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-surface-900 px-1.5 py-0.5 text-xs text-surface-0 shadow',
  {
    variants: {
      orientation: {
        horizontal: 'bottom-full start-1/2 mb-1.5 -translate-x-1/2',
        vertical: 'start-full top-1/2 ms-1.5 -translate-y-1/2',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);
