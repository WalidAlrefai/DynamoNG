import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
  overlayPanelClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — date-range-picker.html only ever binds `[class]="...Classes()"`
// or a plain exported string constant.
export const dateRangePickerTriggerStyles = cva(
  'flex w-full items-center justify-between gap-2 rounded-md border bg-surface-0 ' +
    'text-start text-text-primary transition-colors disabled:pointer-events-none disabled:opacity-60 ' +
    focusRingClass,
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

export const dateRangePickerPanelStyles =
  'z-dropdown w-72 p-3 ' + overlayPanelClass;

export const dateRangePickerHeaderButtonStyles =
  'flex h-8 w-8 items-center justify-center rounded-md text-text-primary hover:bg-surface-100 ' +
  focusRingClass;

export const dateRangePickerQuickJumpButtonStyles =
  'rounded-md px-2 py-1 text-sm font-semibold text-text-primary hover:bg-surface-100 ' +
  focusRingClass;

export const dateRangePickerMonthGridButtonStyles = cva(
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

export const dateRangePickerWeekdayStyles =
  'h-8 w-9 text-center align-middle text-xs font-medium text-text-muted';

// Flat continuous background spanning the full cell width, so consecutive
// in-range days visually connect into one bar — sits underneath the day
// button's own circular endpoint styling (see dateRangePickerDayStyles).
export const dateRangePickerCellStyles = cva('', {
  variants: {
    inRange: {
      true: 'bg-primary/10',
      false: '',
    },
  },
  defaultVariants: { inRange: false },
});

export const dateRangePickerDayStyles = cva(
  'relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ' +
    focusRingClass,
  {
    variants: {
      // An endpoint (start or end of the range, including a single-day
      // range where they coincide) — a solid circle, same treatment
      // DatePicker gives its one selected day.
      endpoint: {
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
    defaultVariants: { endpoint: false, outsideMonth: false, today: false },
  },
);
