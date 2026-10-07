import { cva } from 'class-variance-authority';
import { focusRingClass, overlayPanelClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — tiered-menu.html only ever binds `[class]="...Classes()"`.
// Trigger/chevron/panel shapes independently duplicated from `@dynamong/menu`'s
// own menu.styles.ts (same precedent as Context Menu keeping its own copy
// rather than composing `@dynamong/menu`).
export const tieredMenuTriggerStyles = cva(
  'flex items-center justify-between gap-2 rounded-md border border-border bg-surface-0 ' +
    'px-4 py-2 text-start text-sm text-text-primary transition-colors hover:bg-surface-50 ' +
    focusRingClass,
  {
    variants: {
      fluid: { true: 'w-full', false: '' },
    },
    defaultVariants: { fluid: true },
  },
);

export const tieredMenuChevronStyles = cva(
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

export const tieredMenuPanelStyles =
  'z-dropdown min-w-[10rem] py-1 ' + overlayPanelClass;

// Rows are virtual-focus-only (aria-activedescendant, not real DOM focus —
// see tiered-menu.ts's doc comment), so `active` is a real, JS-driven visual
// variant here rather than relying on :focus-visible the way Menu's own
// menuItemStyles does — same idiom as Cascade Select's cascadeSelectRowStyles
// `active` variant, minus its `selected` axis (nothing here is ever
// persistently "selected" the way a cascade value is).
// `justify-between` here acts on exactly two direct children — the leading
// (icon+label) and trailing (shortcut+badge+caret) groups below — so it
// still spreads correctly now that a row can carry more than the original
// icon/label/caret trio.
export const tieredMenuItemStyles = cva(
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

// Copied from Cascade Select's cascadeSelectCaretStyles — the same "branch
// row has children" affordance.
export const tieredMenuCaretStyles = 'h-4 w-4 shrink-0 text-text-muted';

// Verbatim copy of @dynamong/menu's own menuItemIconClasses — see this
// component's item-type doc comment for why icons are a plain string, not
// wired to @dynamong/icons.
export const tieredMenuItemIconClasses = 'shrink-0';

// Verbatim copy of @dynamong/menu's own menuSeparatorStyles.
export const tieredMenuSeparatorStyles = 'my-1 h-px bg-border';

// A row's own icon+label group (leading) vs shortcut+badge+caret group
// (trailing) — see tieredMenuItemStyles' own comment for why these exist as
// a sibling pair rather than flattening everything into the row itself.
export const tieredMenuItemLeadingClasses = 'flex min-w-0 items-center gap-1.5';
export const tieredMenuItemTrailingClasses =
  'flex shrink-0 items-center gap-1.5';
export const tieredMenuShortcutClasses = 'text-xs text-text-muted';
