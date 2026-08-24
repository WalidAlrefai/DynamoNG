import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — stepper.html only ever binds `[class]="...Classes()"`.
export const stepperRootStyles = 'flex flex-col gap-6';
export const stepperListStyles = 'flex items-start';
export const stepperItemStyles = 'flex flex-1 items-center last:flex-none';
export const stepperPanelStyles = 'text-text-primary';
export const stepperControlsStyles = 'flex items-center justify-between';

export const stepperStepButtonStyles = cva(
  'flex flex-col items-center gap-1.5 rounded-md text-center transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: { disabled: false },
  },
);

// Three mutually-exclusive states per step (not two orthogonal booleans like
// Tabs' active/disabled) — a step is always exactly one of these.
export const stepperCircleStyles = cva(
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
  {
    variants: {
      state: {
        completed: 'border-primary bg-primary text-on-primary',
        active: 'border-primary bg-surface-0 text-primary',
        upcoming: 'border-border bg-surface-0 text-text-muted',
      },
    },
    defaultVariants: { state: 'upcoming' },
  },
);

export const stepperLabelStyles = cva('text-sm transition-colors', {
  variants: {
    state: {
      completed: 'text-text-primary',
      active: 'font-medium text-primary',
      upcoming: 'text-text-muted',
    },
  },
  defaultVariants: { state: 'upcoming' },
});

// The connector line after step i — colored once step i is completed. Same
// hairline-color idiom as Divider's line.
export const stepperConnectorStyles = cva(
  'mx-2 mt-4 h-0.5 flex-1 transition-colors',
  {
    variants: {
      completed: {
        true: 'bg-primary',
        false: 'bg-border',
      },
    },
    defaultVariants: { completed: false },
  },
);
