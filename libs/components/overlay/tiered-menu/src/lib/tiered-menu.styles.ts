import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — tiered-menu.html only ever binds `[class]="...Classes()"`.
// Trigger/chevron/panel shapes independently duplicated from `@dynamong/menu`'s
// own menu.styles.ts (same precedent as Context Menu keeping its own copy
// rather than composing `@dynamong/menu`).
export const tieredMenuTriggerStyles = cva(
  'flex items-center justify-between gap-2 rounded-md border border-border bg-surface-0 ' +
    'px-4 py-2 text-left text-sm text-text-primary transition-colors focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-surface-50',
);

export const tieredMenuChevronStyles = cva('shrink-0 transition-transform duration-200 ease-out', {
  variants: {
    open: {
      true: 'rotate-180',
      false: '',
    },
  },
  defaultVariants: { open: false },
});

export const tieredMenuPanelStyles =
  'z-10 min-w-[10rem] rounded-md border border-border bg-surface-0 py-1 shadow-lg';

// Rows are virtual-focus-only (aria-activedescendant, not real DOM focus —
// see tiered-menu.ts's doc comment), so `active` is a real, JS-driven visual
// variant here rather than relying on :focus-visible the way Menu's own
// menuItemStyles does — same idiom as Cascade Select's cascadeSelectRowStyles
// `active` variant, minus its `selected` axis (nothing here is ever
// persistently "selected" the way a cascade value is).
export const tieredMenuItemStyles = cva(
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

// Copied from Cascade Select's cascadeSelectCaretStyles — the same "branch
// row has children" affordance.
export const tieredMenuCaretStyles = 'h-4 w-4 shrink-0 text-text-muted';
