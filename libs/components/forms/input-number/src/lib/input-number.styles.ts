import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — input-number.html only ever binds `[class]="...Classes()"`.
//
// Mirrors colorPickerWrapperStyles' shape (bordered flex wrapper hosting a
// plain text field + sibling buttons — the buttons can't nest inside the
// input, so the visible chrome lives on this wrapper, not on any child).
export const inputNumberWrapperStyles = cva(
  'flex w-full items-center gap-1 rounded-md border bg-surface-0 text-text-primary ' +
    'transition-colors focus-within:ring-2 focus-within:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-8 px-1 text-sm',
        md: 'h-10 px-1.5 text-base',
        lg: 'h-12 px-2 text-lg',
      },
      invalid: {
        true: 'border-danger focus-within:ring-danger',
        false: 'border-border focus-within:ring-ring',
      },
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

export const inputNumberInputStyles =
  'min-w-0 flex-1 bg-transparent text-center outline-none disabled:cursor-not-allowed';

// Same reasoning as SplitButton's chevron/ColorPicker's trigger: Button has
// no attribute/ElementRef passthrough, so the step buttons are hand-rolled
// plain <button>s rather than nested <dg-button>s.
export const inputNumberButtonStyles = cva(
  'flex shrink-0 items-center justify-center rounded transition-colors ' +
    'hover:bg-surface-200 focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40',
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
