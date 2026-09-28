import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
  overlayPanelClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — date-picker.html only ever binds `[class]="...Classes()"` or
// a plain exported string constant.
export const datePickerTriggerStyles = cva(
  'flex w-full items-center justify-between gap-2 rounded-md border bg-surface-0 ' +
    'text-start text-text-primary transition-colors disabled:pointer-events-none disabled:opacity-60 ' +
    focusRingClass,
  {
    variants: {
      size: controlSizeVariants,
      invalid: {
        // Tint the shared focus ring danger; the accent-coloured ring is the default.
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);

export const datePickerPanelStyles = 'z-dropdown w-72 p-3 ' + overlayPanelClass;

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
