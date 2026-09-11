import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — knob.html only ever binds `[class]="...Classes()"`, except the
// SVG geometry attributes (viewBox/radius/stroke-width/stroke-dashoffset),
// which are continuous values with no discrete class variant that could
// express them — same "deliberate inline/attr-binding exception" pattern as
// Slider's fill width/thumb position, Progress's fill-width, Tree's
// indent-depth, Skeleton's width/height, and Carousel's track transform.
export const knobRootStyles = cva(
  'relative inline-flex select-none items-center justify-center',
  {
    variants: {
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: { disabled: false },
  },
);

export const knobTrackStyles = 'stroke-surface-200 fill-none';

// The <svg> itself is the focusable/interactive element (see knob.ts) — its
// default UA focus outline is a rectangle around the square viewBox, which
// looks wrong on a circular dial. rounded-full lets the ring/box-shadow
// utilities below curve to match, same focus-ring shape Slider's (equally
// circular) thumb uses.
export const knobDialStyles = 'rounded-full outline-none ' + focusRingClass;

// -rotate-90/origin-center are constants (the arc always starts at 12
// o'clock), not continuous values, so they belong here rather than as an
// inline style — only `stroke-dashoffset` itself (bound in knob.html) is
// continuous.
export const knobFillStyles = cva(
  '-rotate-90 origin-center fill-none transition-[stroke-dashoffset]',
  {
    variants: {
      severity: {
        primary: 'stroke-primary',
        secondary: 'stroke-secondary',
        success: 'stroke-success',
        info: 'stroke-info',
        warning: 'stroke-warning',
        danger: 'stroke-danger',
      },
    },
    defaultVariants: { severity: 'primary' },
  },
);

export const knobLabelStyles = cva(
  'pointer-events-none absolute inset-0 flex items-center justify-center font-medium tabular-nums text-text-primary',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);
