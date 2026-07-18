import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — input-text.html only ever binds `[class]="inputClasses()"`.
export const inputTextStyles = cva(
  'block w-full rounded-md border bg-surface-0 text-text-primary transition-colors ' +
    'placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-5 text-lg',
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
