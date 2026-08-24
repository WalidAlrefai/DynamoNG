import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — radio.html only ever binds `[class]="...Classes()"`.
// `flex`, not `inline-flex` — same fix and reasoning as
// `checkboxRootStyles` (checkbox.styles.ts): an inline-level flex
// container's contribution to its surrounding line-box height depends on
// its synthesized baseline, which shifts depending on whether the circle
// span's only child (the dot) is present, making the host's own auto
// height jitter by 1-2px purely based on checked state.
export const radioRootStyles = cva('flex items-center gap-2 select-none', {
  variants: {
    disabled: {
      true: 'cursor-not-allowed opacity-60',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: { disabled: false },
});

export const radioCircleStyles = cva(
  'flex items-center justify-center rounded-full border shrink-0 transition-colors ' +
    'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      checked: {
        true: 'bg-surface-0 border-primary',
        false: 'bg-surface-0 border-border',
      },
    },
    defaultVariants: { size: 'md', checked: false },
  },
);

export const radioDotStyles = cva('rounded-full bg-primary', {
  variants: {
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
  },
  defaultVariants: { size: 'md' },
});
