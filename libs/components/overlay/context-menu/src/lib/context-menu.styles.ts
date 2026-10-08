import { cva } from 'class-variance-authority';
import { overlayPanelClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — context-menu.html only ever binds `[class]="...Classes()"`.
export const contextMenuTriggerStyles = '';

// Copied independently from menu.styles.ts's panel/item shape — not
// exported from @dynamong/menu, so this isn't importable even if desired
// (per-component style redeclaration is the norm in this codebase, same as
// SplitButton's copy).
export const contextMenuPanelStyles =
  'z-dropdown min-w-[10rem] py-1 ' + overlayPanelClass;

// justify-between still works correctly with exactly two children (the
// leading and trailing groups below) even when the trailing group is
// empty — flexbox simply leaves the leading group where it already was.
// Mirrors @dynamong/menu's own identical item-styles shape.
export const contextMenuItemStyles = cva(
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

export const contextMenuItemLeadingClasses =
  'flex min-w-0 items-center gap-1.5';
export const contextMenuItemTrailingClasses =
  'flex shrink-0 items-center gap-1.5';
export const contextMenuShortcutClasses = 'text-xs text-text-muted';

export const contextMenuItemIconClasses = 'shrink-0';

// role="separator" is an ARIA-spec-permitted child of role="menu" — see
// menuSeparatorStyles' own comment in @dynamong/menu for the contrast with
// role="presentation", which isn't.
export const contextMenuSeparatorStyles = 'my-1 h-px bg-border';
