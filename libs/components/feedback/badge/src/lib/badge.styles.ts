import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — badge.html only ever binds `[class]="classes()"`.
//
// Every class below is a static, literal string (never interpolated) so
// Tailwind's content scanner can find it — same constraint documented in
// button.styles.ts.
export const badgeStyles = cva(
  'inline-flex items-center justify-center rounded-full font-medium',
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
      dot: {
        true: 'p-0',
        false: '',
      },
    },
    compoundVariants: [
      // A bare notification dot instead of the pill: no padding, no text —
      // a fixed square per size, overriding that size's own padding classes.
      { dot: true, size: 'sm', class: 'h-2 w-2' },
      { dot: true, size: 'md', class: 'h-2.5 w-2.5' },
      { dot: true, size: 'lg', class: 'h-3 w-3' },
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
      dot: false,
    },
  },
);
