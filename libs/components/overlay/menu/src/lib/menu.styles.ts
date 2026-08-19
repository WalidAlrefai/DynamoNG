import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — menu.html only ever binds `[class]="...Classes()"`.
export const menuTriggerStyles = cva(
  'flex items-center justify-between gap-2 rounded-md border border-border bg-surface-0 ' +
    'px-4 py-2 text-left text-sm text-text-primary transition-colors focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-surface-50',
);

export const menuChevronStyles = cva(
  'shrink-0 transition-transform duration-200 ease-out',
  {
    variants: {
      open: {
        true: 'rotate-180',
        false: '',
      },
    },
    defaultVariants: { open: false },
  },
);

export const menuPanelStyles =
  'z-10 min-w-[10rem] rounded-md border border-border bg-surface-0 py-1 shadow-lg';

export const menuItemStyles = cva(
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
