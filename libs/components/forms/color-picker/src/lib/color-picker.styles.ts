import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — color-picker.html only ever binds `[class]="...Classes()"`,
// except the swatch preview/option buttons' `[style.background-color]`
// (see color-picker.ts), a continuous, arbitrary CSS color value that can't
// be expressed as a discrete cva variant — same "deliberate inline-style
// exception" pattern as Progress's fill-width, Skeleton's width/height,
// Carousel's track transform, and Slider's fill/thumb position.
//
// Mirrors selectTriggerStyles' shape (bordered flex wrapper hosting a plain
// text field + a sibling trigger button — a <button> can't nest inside
// another interactive element, so the visible chrome lives on this wrapper,
// not on either child).
export const colorPickerWrapperStyles = cva(
  'flex w-full items-center gap-2 rounded-md border bg-surface-0 text-text-primary ' +
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
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

export const colorPickerHexInputStyles =
  'min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed';

export const colorPickerSwatchButtonStyles = cva(
  'shrink-0 rounded-md border border-border transition-shadow ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'h-6 w-6',
        md: 'h-7 w-7',
        lg: 'h-8 w-8',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const colorPickerSwatchGridStyles = 'grid grid-cols-5 gap-2 p-3';

export const colorPickerSwatchOptionStyles = cva(
  'h-8 w-8 rounded-md border border-border transition-shadow cursor-pointer ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      selected: {
        true: 'ring-2 ring-primary ring-offset-2',
        false: '',
      },
    },
    defaultVariants: { selected: false },
  },
);

// Native color inputs have inconsistent internal padding across browsers —
// the standard reset trick is to render the input larger than its visible
// box and clip it with an overflow-hidden wrapper, rather than fighting
// each browser's own internal layout for it.
export const colorPickerNativeInputWrapperStyles =
  'h-8 w-8 overflow-hidden rounded-md border border-border cursor-pointer';
export const colorPickerNativeInputStyles =
  '-m-1 h-10 w-10 cursor-pointer border-none p-0';
