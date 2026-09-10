import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingInvalidClass,
  focusRingWithinClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — input-group.html only ever binds `[class]="...Classes()"`.
// Shape copied from passwordWrapperStyles/inputNumberWrapperStyles/
// colorPickerWrapperStyles: a bordered flex wrapper carries all the visible
// chrome (reacting to focus-within, since the actual focusable input is
// projected content, not this component's own element), and whatever's
// projected inside is expected to sit flush against it, unstyled.
export const inputGroupWrapperStyles = cva(
  'flex w-full items-center gap-1 rounded-md border bg-surface-0 text-text-primary ' +
    'transition-colors ' +
    focusRingWithinClass,
  {
    variants: {
      size: controlSizeVariants,
      invalid: {
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);

// No border of their own — they sit inside the wrapper's shared border,
// same reasoning as Select's filter-icon docking (selectFilterIconStyles).
export const inputGroupPrefixStyles = 'inline-flex shrink-0 items-center text-text-muted';
export const inputGroupSuffixStyles = 'inline-flex shrink-0 items-center text-text-muted';
