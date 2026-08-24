import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — spinner.html only ever binds `[class]="classes()"`. Uses
// `border-current`/`border-t-transparent` so it inherits whatever text color
// its container sets, rather than exposing its own `severity` input — the
// same ring this replaced when it was hardcoded inline in button.html.
export const spinnerStyles = cva(
  'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);
