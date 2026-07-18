import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — checkbox.html only ever binds `[class]="...Classes()"`.
export const checkboxRootStyles = cva('inline-flex items-center gap-2 select-none', {
  variants: {
    disabled: {
      true: 'cursor-not-allowed opacity-60',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: { disabled: false },
});

export const checkboxBoxStyles = cva(
  'flex items-center justify-center rounded-sm border shrink-0 transition-colors ' +
    'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      checked: {
        true: 'bg-primary border-primary text-on-primary',
        false: 'bg-surface-0 border-border text-transparent',
      },
    },
    defaultVariants: { size: 'md', checked: false },
  },
);
