import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
  focusRingWithinClass,
  overlayPanelClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — date-picker.html only ever binds `[class]="...Classes()"` or
// a plain exported string constant.
//
// Styles the WRAPPER div, not the typable `<input>` itself — same split
// `@dynamong/select`'s `selectTriggerStyles`/`selectTriggerButtonStyles`
// already use: the wrapper also hosts the calendar-icon button and an
// optional clear button as the input's *siblings*, so the visible chrome
// (border/bg/size/focus ring) lives here and reacts to the input's focus via
// `focus-within`, since the wrapper itself is never the focused element.
export const datePickerTriggerStyles = cva(
  'flex items-center gap-1 rounded-md border text-text-primary transition-colors ' +
    focusRingWithinClass,
  {
    variants: {
      size: controlSizeVariants,
      invalid: {
        // Tint the shared focus ring danger; the accent-coloured ring is the default.
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
      variant: {
        outlined: 'bg-surface-0',
        filled: 'bg-surface-100 border-transparent',
      },
      fluid: {
        true: 'w-full',
        false: '',
      },
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      variant: 'outlined',
      fluid: true,
      disabled: false,
    },
  },
);

// The actual typable element inside the wrapper — transparent and unstyled
// beyond layout, since the wrapper already provides the visible
// border/background/padding/height (via its own `size` variant).
export const datePickerTriggerInputStyles =
  'min-w-0 flex-1 bg-transparent text-start text-text-primary outline-none ' +
  'placeholder:text-text-muted disabled:cursor-not-allowed';

export const datePickerTriggerIconButtonStyles =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted ' +
  'transition-colors hover:text-text-primary disabled:pointer-events-none ' +
  focusRingClass;

export const datePickerPanelStyles = cva(
  'z-dropdown p-3 ' + overlayPanelClass,
  {
    variants: {
      // `numberOfMonths > 1` needs `w-auto` to grow with however many
      // `w-64` month grids render side by side, instead of clipping them to
      // the single-month default's fixed width.
      multiMonth: {
        true: 'w-auto',
        false: 'w-72',
      },
    },
    defaultVariants: { multiMonth: false },
  },
);

export const datePickerMonthGridWidthClass = 'w-64';

export const datePickerHeaderButtonStyles =
  'flex h-8 w-8 items-center justify-center rounded-md text-text-primary hover:bg-surface-100 ' +
  focusRingClass;

export const datePickerQuickJumpButtonStyles =
  'rounded-md px-2 py-1 text-sm font-semibold text-text-primary hover:bg-surface-100 ' +
  focusRingClass;

export const datePickerMonthGridButtonStyles = cva(
  'flex h-9 items-center justify-center rounded-md text-sm transition-colors ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ' +
    focusRingClass,
  {
    variants: {
      current: {
        true: 'bg-primary text-on-primary hover:bg-primary-hover',
        false: 'text-text-primary hover:bg-surface-100',
      },
    },
    defaultVariants: { current: false },
  },
);

export const datePickerWeekdayStyles =
  'h-8 w-9 text-center align-middle text-xs font-medium text-text-muted';

export const datePickerDayStyles = cva(
  'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ' +
    focusRingClass,
  {
    variants: {
      selected: {
        true: 'bg-primary text-on-primary hover:bg-primary-hover',
        false: 'text-text-primary hover:bg-surface-100',
      },
      outsideMonth: {
        true: 'text-text-muted',
        false: '',
      },
      today: {
        true: 'font-semibold ring-1 ring-inset ring-primary',
        false: '',
      },
    },
    defaultVariants: { selected: false, outsideMonth: false, today: false },
  },
);

export const datePickerTimeWrapperStyles =
  'mt-2 flex items-center justify-center gap-2 border-t border-border pt-2';

export const datePickerTimeFieldStyles =
  'flex flex-col items-center gap-0.5 rounded-md px-1 ' + focusRingClass;

export const datePickerTimeStepButtonStyles =
  'flex h-6 w-6 items-center justify-center rounded-md text-xs text-text-primary hover:bg-surface-100 ' +
  focusRingClass;

export const datePickerTimeValueStyles =
  'text-sm font-semibold tabular-nums text-text-primary';

export const datePickerTimeSeparatorStyles =
  'text-sm font-semibold text-text-muted';

export const datePickerMeridiemButtonStyles =
  'ms-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-text-primary hover:bg-surface-100 ' +
  focusRingClass;

export const datePickerButtonBarButtonStyles =
  'rounded-md px-2 py-1 text-sm font-semibold text-text-primary hover:bg-surface-100 ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  focusRingClass;

// Reuses the exact same primary color recipe as datePickerMonthGridButtonStyles'
// `current` variant (bg-primary/text-on-primary/hover:bg-primary-hover) — already
// duplicated this way across date-range-picker/split-button/button rather than
// importing @dynamong/button.
export const datePickerApplyButtonStyles =
  'rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary hover:bg-primary-hover ' +
  focusRingClass;
