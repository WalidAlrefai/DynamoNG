import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — stepper.html only ever binds `[class]="...Classes()"`.
export const stepperRootStyles = 'flex flex-col gap-6';
export const stepperControlsStyles = 'flex items-center justify-between';

export const stepperListStyles = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'items-start',
      vertical: 'flex-col items-stretch',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const stepperItemStyles = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-1 items-center last:flex-none',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const stepperPanelStyles = cva('text-text-primary', {
  variants: {
    orientation: {
      horizontal: '',
      // Indented under the circle+gap width, with breathing room before the
      // next step — content sits directly in the vertical list flow.
      vertical: 'pb-6 ps-11',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const stepperStepButtonStyles = cva(
  'flex items-center rounded-md text-center transition-colors ' +
    focusRingClass,
  {
    variants: {
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: 'cursor-pointer',
      },
      // Horizontal reads top-down per step (icon above label); vertical
      // reads left-to-right per row (icon beside label).
      orientation: {
        horizontal: 'flex-col gap-1.5',
        vertical: 'flex-row gap-2',
      },
    },
    defaultVariants: { disabled: false, orientation: 'horizontal' },
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
// hairline-color idiom as Divider's line. Horizontal: a bar between circles.
// Vertical: a short tick before the panel, roughly centered under the 32px
// (h-8 w-8) circle.
export const stepperConnectorStyles = cva('transition-colors', {
  variants: {
    completed: {
      true: 'bg-primary',
      false: 'bg-border',
    },
    orientation: {
      horizontal: 'mx-2 mt-4 h-0.5 flex-1',
      vertical: 'my-1 ms-4 h-4 w-0.5',
    },
  },
  defaultVariants: { completed: false, orientation: 'horizontal' },
});
