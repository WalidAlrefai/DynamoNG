import { cva } from 'class-variance-authority';

// Mirrors inputNumberWrapperStyles' shape — the toggle button can't nest
// inside the input, so visible chrome lives on this wrapper, reacting to
// focus-within (input OR button focused).
export const passwordWrapperStyles = cva(
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
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

export const passwordInputStyles =
  'min-w-0 flex-1 bg-transparent outline-none placeholder:text-text-muted disabled:cursor-not-allowed';

// Hand-rolled <button>, same reasoning as inputNumberButtonStyles — Button
// has no attribute passthrough for arbitrary sizing inside a field.
export const passwordToggleButtonStyles =
  'inline-flex shrink-0 items-center justify-center rounded p-1 text-text-muted ' +
  'transition-colors hover:bg-surface-200 hover:text-text-primary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ' +
  'disabled:pointer-events-none disabled:opacity-40';

export const passwordMeterWrapperStyles = 'mt-1.5 flex items-center gap-2';
export const passwordMeterLabelStyles = 'text-xs text-text-muted capitalize';
