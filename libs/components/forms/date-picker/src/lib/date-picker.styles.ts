import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  overlayPanelClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — date-picker.html only ever binds `[class]="...Classes()"` or
// a plain exported string constant.
export const datePickerTriggerStyles = cva(
  'flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-0 ' +
    'text-start text-text-primary transition-colors disabled:pointer-events-none disabled:opacity-60 ' +
    focusRingClass,
  {
    variants: {
      size: controlSizeVariants,
    },
    defaultVariants: { size: 'md' },
  },
);

export const datePickerPanelStyles = 'z-dropdown w-72 p-3 ' + overlayPanelClass;

export const datePickerHeaderButtonStyles =
  'flex h-8 w-8 items-center justify-center rounded-md text-text-primary hover:bg-surface-100 ' +
  focusRingClass;

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
