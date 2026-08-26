import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — rating.html only ever binds `[class]="...Classes()"`.
export const ratingRootStyles = cva(
  'inline-flex items-center gap-1 rounded focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
      true: 'text-amber-400',
      false: 'text-surface-300',
    },
    interactive: {
      true: 'cursor-pointer',
      false: 'cursor-default',
    },
  },
  defaultVariants: { size: 'md', filled: false, interactive: true },
});
