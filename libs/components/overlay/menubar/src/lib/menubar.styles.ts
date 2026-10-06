import { cva } from 'class-variance-authority';
import { focusRingClass, overlayPanelClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — menubar.html only ever binds `[class]="...Classes()"` / a raw
// style constant. Bar/panel/row shapes independently duplicated from
// `@dynamong/tiered-menu`'s own tiered-menu.styles.ts (same precedent as
// Tiered Menu keeping its own copy of `@dynamong/menu`'s shapes rather than
// composing it).
export const menubarRootStyles = cva(
  'flex items-center gap-2 rounded-md border border-border bg-surface-0 p-1',
  {
    variants: {
      fluid: { true: 'w-full', false: '' },
    },
    defaultVariants: { fluid: true },
  },
);

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
    'transition-colors ' +
    focusRingClass,
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

export const menubarChevronStyles = cva(
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

export const menubarPanelStyles =
  'z-dropdown min-w-[10rem] py-1 ' + overlayPanelClass;

// Rows are virtual-focus-only (aria-activedescendant, not real DOM focus —
// see menubar.ts's doc comment), so `active` is a real, JS-driven visual
// variant here rather than relying on :focus-visible — same idiom as Tiered
// Menu's own tieredMenuItemStyles. `justify-between` here acts on exactly two
// direct children — the leading (icon+label) and trailing (shortcut+badge+
// caret) groups below — so it still spreads correctly now that a row can
// carry more than the original icon/label/caret trio.
export const menubarRowStyles = cva(
  'flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-start text-sm text-text-primary',
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

// Verbatim copy of @dynamong/menu's own menuItemIconClasses — see this
// component's item-type doc comment for why icons are a plain string, not
// wired to @dynamong/icons.
export const menubarItemIconClasses = 'shrink-0';

// Verbatim copy of @dynamong/menu's own menuSeparatorStyles — role="separator"
// is an ARIA-spec-permitted child of role="menu" (unlike role="presentation",
// which trips aria-required-children).
export const menubarSeparatorStyles = 'my-1 h-px bg-border';

// A row's own icon+label group (leading) vs shortcut+badge+caret group
// (trailing) — see menubarRowStyles' own comment for why these exist as a
// sibling pair rather than flattening everything into the row itself.
export const menubarRowLeadingClasses = 'flex min-w-0 items-center gap-1.5';
export const menubarRowTrailingClasses = 'flex shrink-0 items-center gap-1.5';
export const menubarShortcutClasses = 'text-xs text-text-muted';
