import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — split-button.html only ever binds `[class]="...Classes()"` /
// `[styleClass]`.
export const splitButtonRootStyles = 'inline-flex';
export const splitButtonPrimaryStyles = 'rounded-r-none';

// Mirrors button.styles.ts's severity x variant color matrix so the chevron
// reads as part of the same control — it can't reuse <dg-button> itself
// (see split-button.ts's header comment: no aria-haspopup/aria-expanded
// passthrough, no way to imperatively focus() it), so this is a deliberate,
// scoped duplication of Button's own matrix, the same kind of independent
// redeclaration Badge/Chip/Tag already do for their own severity colors.
export const splitButtonTriggerStyles = cva(
  'inline-flex aspect-square shrink-0 -ml-px items-center justify-center rounded-l-none rounded-r-md ' +
    'font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
      },
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
      size: 'md',
      severity: 'primary',
      variant: 'solid',
    },
  },
);

// Copied independently from menu.styles.ts's panel/item shape — not
// exported from @dynamong/menu, so this isn't importable even if desired
// (per-component style redeclaration is the norm in this codebase).
export const splitButtonPanelStyles =
  'z-10 min-w-[10rem] rounded-md border border-border bg-surface-0 py-1 shadow-lg';

export const splitButtonItemStyles = cva(
  'block w-full cursor-pointer px-4 py-2 text-left text-sm text-text-primary ' +
    'focus-visible:outline-none focus-visible:bg-surface-100',
  {
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'hover:bg-surface-100',
      },
    },
    defaultVariants: { disabled: false },
  },
);
