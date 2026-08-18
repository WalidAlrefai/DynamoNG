import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — tooltip.html only ever binds `[class]="...Classes()"`.
export const tooltipTriggerStyles = cva('inline-block');

export const tooltipPanelStyles = cva(
  'relative pointer-events-none z-50 max-w-xs rounded-md bg-surface-900 px-2.5 py-1.5 text-sm text-surface-0 shadow-md',
  {
    variants: {
      position: {
        top: '',
        bottom: '',
        left: '',
        right: '',
      },
    },
    defaultVariants: { position: 'top' },
  },
);

// Small rotated square riding on the panel's edge, positioned per side so it
// always points from the panel back toward the trigger it's anchored to.
export const tooltipArrowStyles = cva(
  'absolute h-2 w-2 rotate-45 bg-surface-900',
  {
    variants: {
      position: {
        top: 'bottom-[-4px] left-1/2 -translate-x-1/2',
        bottom: 'top-[-4px] left-1/2 -translate-x-1/2',
        left: 'right-[-4px] top-1/2 -translate-y-1/2',
        right: 'left-[-4px] top-1/2 -translate-y-1/2',
      },
    },
    defaultVariants: { position: 'top' },
  },
);
