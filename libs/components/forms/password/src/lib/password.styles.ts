import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
  focusRingWithinClass,
} from '@dynamong/utils/styles';

// Mirrors inputNumberWrapperStyles' shape — the toggle button can't nest
// inside the input, so visible chrome lives on this wrapper, reacting to
// focus-within (input OR button focused).
export const passwordWrapperStyles = cva(
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
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

export const passwordInputStyles =
  'min-w-0 flex-1 bg-transparent outline-none placeholder:text-text-muted disabled:cursor-not-allowed';

// Hand-rolled <button>, same reasoning as inputNumberButtonStyles — Button
// has no attribute passthrough for arbitrary sizing inside a field.
export const passwordToggleButtonStyles =
  'inline-flex shrink-0 items-center justify-center rounded-sm p-1 text-text-muted ' +
  'transition-colors hover:bg-surface-200 hover:text-text-primary ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  focusRingClass;

export const passwordMeterWrapperStyles = 'mt-1.5 flex items-center gap-2';
export const passwordMeterLabelStyles = 'text-xs text-text-muted capitalize';
