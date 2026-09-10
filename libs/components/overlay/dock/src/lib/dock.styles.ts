import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — dock.html binds `[class]="...Classes()"` (the one exception is
// each tile's continuous `[style.transform]` magnification, same posture as
// Progress's `[style.width.%]`).

export const dockRootStyles = cva('inline-flex', {
  variants: {
    position: {
      bottom: 'items-end',
      top: 'items-start',
      left: 'justify-start',
      right: 'justify-end',
    },
  },
  defaultVariants: { position: 'bottom' },
});

export const dockListStyles = cva(
  'flex list-none gap-2 rounded-2xl border border-border bg-surface-0/80 p-2 shadow-lg backdrop-blur',
  {
    variants: {
      position: {
        bottom: 'flex-row items-end',
        top: 'flex-row items-start',
        left: 'flex-col items-start',
        right: 'flex-col items-end',
      },
    },
    defaultVariants: { position: 'bottom' },
  },
);

export const dockItemStyles = cva(
  'group/tile relative flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-lg text-text-primary ' +
    'transition-transform duration-150 ease-out will-change-transform motion-reduce:transition-none ' +
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-40 ' +
    focusRingClass,
  {
    variants: {
      position: {
        bottom: 'origin-bottom',
        top: 'origin-top',
        left: 'origin-left',
        right: 'origin-right',
      },
    },
    defaultVariants: { position: 'bottom' },
  },
);

export const dockLabelStyles = cva(
  'pointer-events-none absolute whitespace-nowrap rounded-sm bg-surface-900 px-1.5 py-0.5 text-xs text-surface-0 ' +
    'opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100',
  {
    variants: {
      position: {
        bottom: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
        top: 'top-full left-1/2 mt-2 -translate-x-1/2',
        left: 'left-full top-1/2 ml-2 -translate-y-1/2',
        right: 'right-full top-1/2 mr-2 -translate-y-1/2',
      },
    },
    defaultVariants: { position: 'bottom' },
  },
);
