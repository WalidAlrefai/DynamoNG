import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — avatar.html only ever binds `[class]="...Classes()"`, except
// for the static, variant-free `<img>` class (see the comment in
// avatar.html).
export const avatarRootStyles = cva(
  'inline-flex items-center justify-center overflow-hidden rounded-full ' +
    'bg-surface-200 font-medium text-text-primary select-none',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);
