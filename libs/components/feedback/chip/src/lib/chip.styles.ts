import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — chip.html only ever binds `[class]="...Classes()"` or a
// plain exported string constant.
export const chipStyles = cva(
  'inline-flex items-center gap-1 rounded-full font-medium',
  {
    variants: {
      severity: {
        primary: '',
        secondary: '',
        success: '',
        info: '',
        warning: '',
        danger: '',
      },
      variant: {
        solid: '',
        outline: 'bg-transparent border',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    compoundVariants: [
      {
        severity: 'primary',
        variant: 'solid',
        class: 'bg-primary text-on-primary',
      },
      {
        severity: 'primary',
        variant: 'outline',
        class: 'text-primary border-primary',
      },

      {
        severity: 'secondary',
        variant: 'solid',
        class: 'bg-secondary text-on-secondary',
      },
      {
        severity: 'secondary',
        variant: 'outline',
        class: 'text-secondary border-secondary',
      },

      {
        severity: 'success',
        variant: 'solid',
        class: 'bg-success text-on-success',
      },
      {
        severity: 'success',
        variant: 'outline',
        class: 'text-success border-success',
      },

      { severity: 'info', variant: 'solid', class: 'bg-info text-on-info' },
      { severity: 'info', variant: 'outline', class: 'text-info border-info' },

      {
        severity: 'warning',
        variant: 'solid',
        class: 'bg-warning text-on-warning',
      },
      {
        severity: 'warning',
        variant: 'outline',
        class: 'text-warning border-warning',
      },

      {
        severity: 'danger',
        variant: 'solid',
        class: 'bg-danger text-on-danger',
      },
      {
        severity: 'danger',
        variant: 'outline',
        class: 'text-danger border-danger',
      },
    ],
    defaultVariants: {
      severity: 'primary',
      variant: 'solid',
      size: 'md',
    },
  },
);

// `bg-current/10` (not a fixed surface token) is deliberate: it tints
// against whatever foreground color the chip's severity/variant already
// resolved to, so the hover state reads correctly on both solid (colored
// background) and outline (transparent background) chips alike.
export const chipRemoveButtonStyles =
  '-mr-1 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 ' +
  'transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-1';
