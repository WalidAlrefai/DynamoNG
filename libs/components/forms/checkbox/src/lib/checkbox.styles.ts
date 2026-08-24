import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — checkbox.html only ever binds `[class]="...Classes()"`.
// `flex`, not `inline-flex` — an inline-level flex container's contribution
// to its surrounding line-box height depends on its synthesized baseline,
// which shifts depending on whether the box span's only child (the check
// icon / indeterminate dash) is present. That made the host's own auto
// height jitter by 1-2px purely based on checked state (confirmed live via
// getBoundingClientRect before/after toggling — see the checkbox/radio
// row-height-jitter fix). Block-level `flex` removes it from that inline
// formatting context entirely.
export const checkboxRootStyles = cva('flex items-center gap-2 select-none', {
  variants: {
    disabled: {
      true: 'cursor-not-allowed opacity-60',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: { disabled: false },
});

export const checkboxBoxStyles = cva(
  'flex items-center justify-center rounded-sm border shrink-0 transition-colors ' +
    'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      checked: {
        true: 'bg-primary border-primary text-on-primary',
        false: 'bg-surface-0 border-border text-transparent',
      },
    },
    defaultVariants: { size: 'md', checked: false },
  },
);

// Scales with `size` the same way the checkmark icon does (`dg-icon-check
// [size]="size()"`) — previously a hardcoded `h-0.5 w-2.5` regardless of
// size, which looked disproportionately small inside the `lg` box.
export const checkboxIndeterminateDashStyles = cva('block h-0.5 bg-current', {
  variants: {
    size: {
      sm: 'w-2',
      md: 'w-2.5',
      lg: 'w-3',
    },
  },
  defaultVariants: { size: 'md' },
});
