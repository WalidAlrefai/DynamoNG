import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — date-picker.html only ever binds `[class]="...Classes()"` or
// a plain exported string constant.
export const datePickerTriggerStyles = cva(
  'flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-0 ' +
    'text-left text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-5 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const datePickerPanelStyles =
  'z-10 w-72 rounded-md border border-border bg-surface-0 p-3 shadow-lg';

export const datePickerHeaderButtonStyles =
  'flex h-8 w-8 items-center justify-center rounded-md text-text-primary hover:bg-surface-100 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const datePickerWeekdayStyles =
  'h-8 w-9 text-center align-middle text-xs font-medium text-text-muted';

export const datePickerDayStyles = cva(
  'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
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
