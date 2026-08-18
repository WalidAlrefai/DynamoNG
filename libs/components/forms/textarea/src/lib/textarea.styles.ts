import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — textarea.html only ever binds `[class]="textareaClasses()"`.
export const textareaStyles = cva(
  'block w-full rounded-md border bg-surface-0 text-text-primary transition-colors ' +
    'placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'min-h-16 px-3 py-1.5 text-sm',
        md: 'min-h-20 px-4 py-2 text-base',
        lg: 'min-h-24 px-5 py-2.5 text-lg',
      },
      invalid: {
        true: 'border-danger focus-visible:ring-danger',
        false: 'border-border focus-visible:ring-ring',
      },
      // Manual resizing and autoResize's own height management fight each
      // other, so the drag handle is disabled whenever autoResize is on.
      autoResize: {
        true: 'resize-none overflow-hidden',
        false: 'resize-y',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      autoResize: false,
    },
  },
);
