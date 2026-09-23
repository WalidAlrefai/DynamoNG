import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
  focusRingWithinClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — color-picker.html only ever binds `[class]="...Classes()"`,
// except the swatch preview/option buttons' `[style.background-color]`, the
// alpha slider's/trigger preview's `[style.background]` gradients, and the
// saturation/value square's own gradient + thumb position (see
// color-picker.ts), continuous, arbitrary CSS color/position values that
// can't be expressed as a discrete cva variant — same "deliberate
// inline-style exception" pattern as Progress's fill-width, Skeleton's
// width/height, Carousel's track transform, and Slider's fill/thumb
// position.
//
// Mirrors selectTriggerStyles' shape (bordered flex wrapper hosting a plain
// text field + a sibling trigger button — a <button> can't nest inside
// another interactive element, so the visible chrome lives on this wrapper,
// not on either child).
export const colorPickerWrapperStyles = cva(
  'flex w-full items-center gap-2 rounded-md border bg-surface-0 text-text-primary ' +
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

export const colorPickerHexInputStyles =
  'min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed';

export const colorPickerSwatchButtonStyles = cva(
  'shrink-0 rounded-md border border-border transition-shadow disabled:cursor-not-allowed ' +
    focusRingClass,
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
    focusRingClass,
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

// A CSS string, not color math — lives here (with every other visual
// constant), not in color-picker.color.ts, which stays pure hex-string math.
export const CHECKERBOARD_GRADIENT =
  'repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 0 0 / 8px 8px';

export const colorPickerAlphaWrapperStyles = 'flex items-center gap-2 px-3 pb-3';

// Shared by both the alpha slider and the hue slider (customPicker) — their
// track/thumb visuals are identical; only each instance's own
// [style.background] gradient differs.
export const colorPickerRangeSliderStyles = cva(
  'w-full appearance-none rounded-full bg-transparent disabled:cursor-not-allowed ' +
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ' +
    '[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border ' +
    '[&::-webkit-slider-thumb]:bg-surface-0 [&::-webkit-slider-thumb]:shadow ' +
    '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full ' +
    '[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border ' +
    '[&::-moz-range-thumb]:bg-surface-0 [&::-moz-range-thumb]:shadow ' +
    focusRingClass,
  {
    variants: {
      size: {
        sm: 'h-1.5 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3',
        md: 'h-2 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5',
        lg: 'h-2.5 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const colorPickerAlphaReadoutStyles =
  'w-9 shrink-0 text-end text-xs tabular-nums text-text-muted';

// Static — unlike the alpha track, hue's gradient never depends on the
// current color, so it's a plain constant, not a computed().
export const HUE_TRACK_GRADIENT =
  'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), ' +
  'hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), ' +
  'hsl(300,100%,50%), hsl(360,100%,50%))';

export const colorPickerSvSquareStyles =
  'relative h-32 w-full cursor-crosshair rounded-md border border-border';
export const colorPickerSvThumbStyles =
  'absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ' +
  'border-2 border-white shadow ring-1 ring-black/30 pointer-events-none';
export const colorPickerHueWrapperStyles = 'px-3 pt-3';
