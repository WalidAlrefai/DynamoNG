import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — menubar.html only ever binds `[class]="...Classes()"` / a raw
// style constant. Bar/panel/row shapes independently duplicated from
// `@dynamong/tiered-menu`'s own tiered-menu.styles.ts (same precedent as
// Tiered Menu keeping its own copy of `@dynamong/menu`'s shapes rather than
// composing it).
export const menubarRootStyles =
  'flex items-center gap-2 rounded-md border border-border bg-surface-0 p-1';

// The actual `role="menubar"` element is just a flex row of items now — the
// bordered/padded pill look lives on `menubarRootStyles` (the outer wrapper
// around `start`/bar/`end`) instead, since ARIA's menubar role only permits
// menuitem-family children and projected `start`/`end` content must sit
// outside it (see menubar.ts's class doc comment). `flex-1` so the item row
// fills the remaining space and pushes `end` to the far right — same
// technique as Toolbar's own `toolbarCenterStyles`.
export const menubarBarStyles = 'flex flex-1 items-center gap-1';

// Copied from Toolbar's own toolbarStartStyles/toolbarEndStyles shape —
// plain flex containers, no dedicated per-slot inputs (pure `ng-content`
// projection, same precedent).
export const menubarStartStyles = 'flex shrink-0 items-center gap-2';
export const menubarEndStyles = 'flex shrink-0 items-center gap-2';

// `focused` tracks the roving-tabindex position (Tabs' precedent) — always
// exactly one item, open or closed. `open` tracks whether THIS item's own
// dropdown is currently showing (Menu's precedent). Both can be true at once.
export const menubarItemStyles = cva(
  'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-primary ' +
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      open: {
        true: 'bg-surface-100',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'hover:bg-surface-100',
      },
    },
    defaultVariants: { open: false, disabled: false },
  },
);

export const menubarChevronStyles = cva('shrink-0 transition-transform duration-200 ease-out', {
  variants: {
    open: {
      true: 'rotate-180',
      false: '',
    },
  },
  defaultVariants: { open: false },
});

export const menubarPanelStyles =
  'z-10 min-w-[10rem] rounded-md border border-border bg-surface-0 py-1 shadow-lg';

// Rows are virtual-focus-only (aria-activedescendant, not real DOM focus —
// see menubar.ts's doc comment), so `active` is a real, JS-driven visual
// variant here rather than relying on :focus-visible — same idiom as Tiered
// Menu's own tieredMenuItemStyles.
export const menubarRowStyles = cva(
  'flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-sm text-text-primary',
  {
    variants: {
      active: {
        true: 'bg-surface-100',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'hover:bg-surface-100',
      },
    },
    defaultVariants: { active: false, disabled: false },
  },
);

// Copied from Tiered Menu's tieredMenuCaretStyles — the same "branch row has
// children" affordance, for nested flyout rows within an open dropdown.
export const menubarCaretStyles = 'h-4 w-4 shrink-0 text-text-muted';
