import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — button.html only ever binds `[class]="classes()"`.
//
// Every class below is a static, literal string (never interpolated) so
// Tailwind's content scanner can find it — dynamically built class names
// like `bg-${severity}` are invisible to Tailwind's JIT compiler and must
// never be used, even though it would shrink this file considerably.
export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-60',
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
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      variant: {
        solid: '',
        outline: 'bg-transparent border',
        text: 'bg-transparent',
      },
    },
    compoundVariants: [
      { severity: 'primary', variant: 'solid', class: 'bg-primary text-on-primary hover:bg-primary-hover' },
      { severity: 'primary', variant: 'outline', class: 'text-primary border-primary hover:bg-primary/10' },
      { severity: 'primary', variant: 'text', class: 'text-primary hover:bg-primary/10' },

      { severity: 'secondary', variant: 'solid', class: 'bg-secondary text-on-secondary hover:bg-secondary-hover' },
      { severity: 'secondary', variant: 'outline', class: 'text-secondary border-secondary hover:bg-secondary/10' },
      { severity: 'secondary', variant: 'text', class: 'text-secondary hover:bg-secondary/10' },

      { severity: 'success', variant: 'solid', class: 'bg-success text-on-success hover:bg-success-hover' },
      { severity: 'success', variant: 'outline', class: 'text-success border-success hover:bg-success/10' },
      { severity: 'success', variant: 'text', class: 'text-success hover:bg-success/10' },

      { severity: 'info', variant: 'solid', class: 'bg-info text-on-info hover:bg-info-hover' },
      { severity: 'info', variant: 'outline', class: 'text-info border-info hover:bg-info/10' },
      { severity: 'info', variant: 'text', class: 'text-info hover:bg-info/10' },

      { severity: 'warning', variant: 'solid', class: 'bg-warning text-on-warning hover:bg-warning-hover' },
      { severity: 'warning', variant: 'outline', class: 'text-warning border-warning hover:bg-warning/10' },
      { severity: 'warning', variant: 'text', class: 'text-warning hover:bg-warning/10' },

      { severity: 'danger', variant: 'solid', class: 'bg-danger text-on-danger hover:bg-danger-hover' },
      { severity: 'danger', variant: 'outline', class: 'text-danger border-danger hover:bg-danger/10' },
      { severity: 'danger', variant: 'text', class: 'text-danger hover:bg-danger/10' },
    ],
    defaultVariants: {
      severity: 'primary',
      size: 'md',
      variant: 'solid',
    },
  },
);
