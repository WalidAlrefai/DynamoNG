import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — context-menu.html only ever binds `[class]="...Classes()"`.
export const contextMenuTriggerStyles = '';

// Copied independently from menu.styles.ts's panel/item shape — not
// exported from @dynamong/menu, so this isn't importable even if desired
// (per-component style redeclaration is the norm in this codebase, same as
// SplitButton's copy).
export const contextMenuPanelStyles =
  'z-10 min-w-[10rem] rounded-md border border-border bg-surface-0 py-1 shadow-lg';

export const contextMenuItemStyles = cva(
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
