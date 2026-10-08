import { cva } from 'class-variance-authority';
import { focusRingClass, overlayPanelClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — menu.html only ever binds `[class]="...Classes()"`.
export const menuTriggerStyles = cva(
  'flex items-center justify-between gap-2 rounded-md border border-border bg-surface-0 ' +
    'px-4 py-2 text-start text-sm text-text-primary transition-colors hover:bg-surface-50 ' +
    focusRingClass,
  {
    variants: {
      fluid: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { fluid: false },
  },
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
  'z-dropdown min-w-[10rem] py-1 ' + overlayPanelClass;

// justify-between still works correctly with exactly two children (the
// leading and trailing groups below) even when the trailing group is
// empty — flexbox simply leaves the leading group where it already was.
export const menuItemStyles = cva(
  'flex w-full items-center justify-between gap-2 cursor-pointer px-4 py-2 text-start text-sm text-text-primary ' +
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

export const menuItemLeadingClasses = 'flex min-w-0 items-center gap-1.5';
export const menuItemTrailingClasses = 'flex shrink-0 items-center gap-1.5';
export const menuShortcutClasses = 'text-xs text-text-muted';

export const menuItemIconClasses = 'shrink-0';

// A thin divider row — role="separator" is an ARIA-spec-permitted child of
// role="menu" (unlike role="presentation", which isn't a valid owned
// element and trips aria-required-children — see OrderList's no-results
// row fix this session for the contrast).
export const menuSeparatorStyles = 'my-1 h-px bg-border';
