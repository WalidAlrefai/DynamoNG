import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — input-text.html only ever binds `[class]="inputClasses()"`.
export const inputTextStyles = cva(
  'block rounded-md border text-text-primary transition-colors ' +
    'placeholder:text-text-muted ' +
    focusRingClass +
    ' disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: controlSizeVariants,
      invalid: {
        // Tint the shared focus ring danger; the accent-coloured ring is the default.
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
      variant: {
        outlined: 'bg-surface-0',
        filled: 'bg-surface-100 border-transparent',
      },
      fluid: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      variant: 'outlined',
      fluid: true,
    },
  },
);
