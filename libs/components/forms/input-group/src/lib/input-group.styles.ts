import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — input-group.html only ever binds `[class]="...Classes()"`.
// Shape copied from passwordWrapperStyles/inputNumberWrapperStyles/
// colorPickerWrapperStyles: a bordered flex wrapper carries all the visible
// chrome (reacting to focus-within, since the actual focusable input is
// projected content, not this component's own element), and whatever's
// projected inside is expected to sit flush against it, unstyled.
export const inputGroupWrapperStyles = cva(
  'flex w-full items-center gap-1 rounded-md border bg-surface-0 text-text-primary ' +
    'transition-colors focus-within:ring-2 focus-within:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-5 text-lg',
      },
      invalid: {
        true: 'border-danger focus-within:ring-danger',
        false: 'border-border focus-within:ring-ring',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);

// No border of their own — they sit inside the wrapper's shared border,
// same reasoning as Select's filter-icon docking (selectFilterIconStyles).
export const inputGroupPrefixStyles = 'inline-flex shrink-0 items-center text-text-muted';
export const inputGroupSuffixStyles = 'inline-flex shrink-0 items-center text-text-muted';
