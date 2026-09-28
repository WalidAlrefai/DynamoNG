import { cva } from 'class-variance-authority';
import {
  focusRingClass,
  overlayPanelClass,
  sectionHeadingBaseClass,
} from '@dynamong/utils/styles';

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
    'transition-colors ' +
    focusRingClass,
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

// Verbatim copy of @dynamong/menu's own menuItemIconClasses — see this
// component's item-type doc comment for why icons are a plain string, not
// wired to @dynamong/icons.
export const megaMenuItemIconClasses = 'shrink-0';

export const megaMenuChevronStyles = cva(
  'shrink-0 transition-transform duration-200 ease-out',
  {
    variants: { open: { true: 'rotate-180', false: '' } },
    defaultVariants: { open: false },
  },
);

export const megaMenuPanelStyles =
  'z-dropdown flex gap-8 p-4 ' + overlayPanelClass;

export const megaMenuColumnStyles = 'flex min-w-[10rem] flex-col gap-1';

export const megaMenuColumnHeaderStyles =
  'px-2 pb-1 ' + sectionHeadingBaseClass;

// Links are virtual-focus-only (aria-activedescendant, not real DOM focus),
// so `active` is a JS-driven visual variant rather than `:focus-visible` —
// same idiom as Menubar's own `menubarRowStyles`.
export const megaMenuLinkStyles = cva(
  'block cursor-pointer rounded-sm px-2 py-1.5 text-start text-sm text-text-primary',
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

// A link's own icon+label wrapper, nested INSIDE the `block` `megaMenuLinkStyles`
// div above rather than making that div itself `flex` — a link with no icon
// renders exactly one child (the label text) here, so this single-item flex
// row wraps/sizes its text identically to the old bare interpolation; only a
// link WITH an icon gets the side-by-side layout. Keeps every existing,
// icon-less link's rendering byte-for-byte unchanged.
export const megaMenuLinkContentStyles = 'flex items-center gap-1.5';
export const megaMenuLinkIconClasses = 'shrink-0';
