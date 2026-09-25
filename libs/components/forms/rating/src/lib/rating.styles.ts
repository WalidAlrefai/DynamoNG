import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — rating.html only ever binds `[class]="...Classes()"`.
export const ratingRootStyles = cva(
  'inline-flex items-center gap-1 rounded-sm ' + focusRingClass,
  {
    variants: {
      disabled: {
        true: 'opacity-60',
        false: '',
      },
    },
    defaultVariants: { disabled: false },
  },
);

// Plain layout wrapper for each star's pointer target — tabindex="-1", the
// group's own `role="slider"` element (rating.html's root) is the single tab
// stop, same shape as Slider's non-focusable track/fill around its thumb.
export const ratingStarButtonStyles = 'inline-flex';

export const ratingStarStyles = cva('transition-colors', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
    filled: {
      true: 'text-warning',
      false: 'text-surface-300',
    },
    interactive: {
      true: 'cursor-pointer',
      false: 'cursor-default',
    },
  },
  defaultVariants: { size: 'md', filled: false, interactive: true },
});

// allowHalf mode's fill mechanism: a background (always-empty) star and a
// foreground (always-filled) star clipped to a percentage width via an
// overflow-hidden wrapper — crisp at any fraction, no clip-path needed. The
// size variant lives on the wrapper below; both SVGs just fill 100% of it.
export const ratingStarWrapperStyles = cva('relative inline-block', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },
  defaultVariants: { size: 'md' },
});
export const ratingStarBackgroundClasses =
  'absolute inset-0 h-full w-full text-surface-300 transition-colors';
export const ratingStarForegroundWrapperClasses =
  'absolute inset-0 overflow-hidden';
export const ratingStarForegroundClasses =
  'h-full w-full text-warning transition-colors';

// Two invisible half-width click/hover zones layered over each star in
// allowHalf mode (left = half, right = full) — rendered after the SVGs in
// DOM order, so no explicit z-index is needed for them to receive pointer
// events.
export const ratingStarHalfZoneStyles = cva('absolute inset-y-0 w-1/2', {
  variants: {
    // 'left'/'right' name the half being clicked (lower value / higher
    // value), but map to logical start-0/end-0 — in RTL, stars themselves
    // render in mirrored order, so "start half = lower portion of this
    // star" stays correct relative to that flipped layout too.
    side: {
      left: 'start-0',
      right: 'end-0',
    },
    interactive: {
      true: 'cursor-pointer',
      false: 'cursor-default',
    },
  },
  defaultVariants: { side: 'left', interactive: true },
});
