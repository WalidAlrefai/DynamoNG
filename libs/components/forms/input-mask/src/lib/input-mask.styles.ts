import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — input-mask.html only ever binds `[class]="inputClasses()"`.
// Identical to input-text's chrome (same border/padding/focus-ring shape) —
// Input Mask looks exactly like Input Text, only its behavior differs.
export const inputMaskStyles = cva(
  'block w-full rounded-md border bg-surface-0 text-text-primary transition-colors ' +
    'placeholder:text-text-muted ' +
    focusRingClass +
    ' disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: controlSizeVariants,
      invalid: {
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  },
);
