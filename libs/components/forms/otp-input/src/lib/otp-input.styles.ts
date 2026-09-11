import { cva } from 'class-variance-authority';
import { focusRingClass, focusRingInvalidClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — otp-input.html only ever binds `[class]="...Classes()"`.
export const otpInputRootStyles = 'flex gap-2';

// Mirrors inputTextStyles' shape (size/invalid variants, same size scale),
// just narrower and centered for a single character per box.
export const otpInputBoxStyles = cva(
  'block w-10 rounded-md border bg-surface-0 text-center text-text-primary transition-colors ' +
    focusRingClass +
    ' disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      // Fixed-`w-10` single-char box — height/text match the shared scale but
      // there is no inline padding, so it stays a local triad.
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg',
      },
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
