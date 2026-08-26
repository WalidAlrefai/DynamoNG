import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — otp-input.html only ever binds `[class]="...Classes()"`.
export const otpInputRootStyles = 'flex gap-2';

// Mirrors inputTextStyles' shape (size/invalid variants, same size scale),
// just narrower and centered for a single character per box.
export const otpInputBoxStyles = cva(
  'block w-10 rounded-md border bg-surface-0 text-center text-text-primary transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg',
      },
      invalid: {
        true: 'border-danger focus-visible:ring-danger',
        false: 'border-border focus-visible:ring-ring',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  },
);
