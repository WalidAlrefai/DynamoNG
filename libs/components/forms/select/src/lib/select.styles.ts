import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — select.html only ever binds `[class]="...Classes()"`.
export const selectTriggerStyles = cva(
  'flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-0 ' +
    'text-left text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-5 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const selectListboxStyles =
  'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface-0 py-1 shadow-lg';

export const selectOptionStyles = cva('cursor-pointer px-4 py-2 text-sm text-text-primary', {
  variants: {
    active: {
      true: 'bg-primary text-on-primary',
      false: '',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-60',
      false: '',
    },
  },
  defaultVariants: { active: false, disabled: false },
});
