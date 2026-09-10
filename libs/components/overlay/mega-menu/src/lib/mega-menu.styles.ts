import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — mega-menu.html only ever binds `[class]="...Classes()"` or a
// raw style constant. Bar/panel/row shapes independently duplicated from
// `@dynamong/menubar`'s own menubar.styles.ts (same precedent as Menubar
// keeping its own copy of Tiered Menu's shapes rather than composing it).

export const megaMenuRootStyles = cva(
  'flex gap-2 rounded-md border border-border bg-surface-0 p-1',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row items-center',
        vertical: 'w-56 flex-col items-stretch',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

export const megaMenuBarStyles = cva('flex flex-1 gap-1', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-stretch',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const megaMenuStartStyles = 'flex shrink-0 items-center gap-2';
export const megaMenuEndStyles = 'flex shrink-0 items-center gap-2';

export const megaMenuItemStyles = cva(
  'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-primary ' +
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      open: { true: 'bg-surface-100', false: '' },
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'hover:bg-surface-100',
      },
    },
    defaultVariants: { open: false, disabled: false },
  },
);

export const megaMenuChevronStyles = cva(
  'shrink-0 transition-transform duration-200 ease-out',
  {
    variants: { open: { true: 'rotate-180', false: '' } },
    defaultVariants: { open: false },
  },
);

export const megaMenuPanelStyles =
  'z-10 flex gap-8 rounded-md border border-border bg-surface-0 p-4 shadow-lg';

export const megaMenuColumnStyles = 'flex min-w-[10rem] flex-col gap-1';

export const megaMenuColumnHeaderStyles =
  'px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted';

// Links are virtual-focus-only (aria-activedescendant, not real DOM focus),
// so `active` is a JS-driven visual variant rather than `:focus-visible` —
// same idiom as Menubar's own `menubarRowStyles`.
export const megaMenuLinkStyles = cva(
  'block cursor-pointer rounded px-2 py-1.5 text-left text-sm text-text-primary',
  {
    variants: {
      active: { true: 'bg-surface-100', false: '' },
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'hover:bg-surface-100',
      },
    },
    defaultVariants: { active: false, disabled: false },
  },
);
