import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
  focusRingWithinClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — input-number.html only ever binds `[class]="...Classes()"`.
//
// Mirrors colorPickerWrapperStyles' shape (bordered flex wrapper hosting a
// plain text field + sibling buttons — the buttons can't nest inside the
// input, so the visible chrome lives on this wrapper, not on any child).
export const inputNumberWrapperStyles = cva(
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
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    // Tighter inline padding than the shared triad — the stepper buttons sit
    // inside the wrapper and need the room.
    compoundVariants: [
      { size: 'sm', class: 'px-1' },
      { size: 'md', class: 'px-1.5' },
      { size: 'lg', class: 'px-2' },
    ],
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

export const inputNumberInputStyles =
  'min-w-0 flex-1 bg-transparent text-center outline-none disabled:cursor-not-allowed';

// Same reasoning as SplitButton's chevron/ColorPicker's trigger: Button has
// no attribute/ElementRef passthrough, so the step buttons are hand-rolled
// plain <button>s rather than nested <dg-button>s.
export const inputNumberButtonStyles = cva(
  'flex shrink-0 items-center justify-center rounded-sm transition-colors ' +
    'hover:bg-surface-200 disabled:pointer-events-none disabled:opacity-40 ' +
    focusRingClass,
  {
    variants: {
      size: {
        sm: 'h-6 w-6 text-sm',
        md: 'h-7 w-7 text-base',
        lg: 'h-8 w-8 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);
