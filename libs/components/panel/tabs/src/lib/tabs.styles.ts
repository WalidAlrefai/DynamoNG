import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — tabs.html only ever binds `[class]="...Classes()"`.
export const tabsRootStyles = cva('flex gap-2', {
  variants: {
    orientation: {
      horizontal: 'flex-col',
      vertical: 'flex-row',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const tabsTablistRowStyles = cva('flex gap-2', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-stretch',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const tabsTablistStyles = cva('flex gap-1', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center border-b border-border',
      vertical: 'flex-col items-stretch border-e border-border',
    },
    scrollable: {
      true: 'flex-nowrap',
      false: 'flex-wrap',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', scrollable: true, class: 'overflow-x-auto' },
    { orientation: 'vertical', scrollable: true, class: 'overflow-y-auto' },
  ],
  defaultVariants: { orientation: 'horizontal', scrollable: false },
});

export const tabsPanelStyles = cva(
  'text-text-primary focus-visible:outline-none',
  {
    variants: {
      orientation: {
        horizontal: 'pt-4',
        vertical: 'ps-4',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

// Same filled-scrim shape as Carousel's/ImageGallery's arrows, but a plain
// native <button> (not dg-button): Tabs is tier:0 and can't take on a
// tier:1 dependency just for two scroll-nav buttons.
export const tabsScrollNavButtonStyles = cva(
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-0 text-text-primary transition-colors ' +
    focusRingClass,
  {
    variants: {
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-40',
        false: 'cursor-pointer hover:bg-surface-100',
      },
    },
    defaultVariants: { disabled: false },
  },
);

// Same rotate-the-chevron approach as Carousel's own carouselArrowIconStyles
// — the scroll-nav buttons reuse the same left/right chevron SVGs for
// up/down, just visually rotated, rather than swapping paths.
export const tabsScrollNavIconStyles = cva(
  'transition-[rotate] duration-200 motion-reduce:transition-none',
  {
    variants: {
      orientation: {
        horizontal: 'rotate-0',
        vertical: 'rotate-90',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

export const tabsTabStyles = cva(
  'inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 ' +
    'text-sm font-medium transition-colors ' +
    focusRingClass,
  {
    variants: {
      orientation: {
        horizontal: '-mb-px rounded-t-md border-b-2',
        vertical: '-me-px rounded-s-md border-e-2',
      },
      active: {
        true: 'border-primary text-primary',
        false: 'border-transparent text-text-muted hover:text-text-primary',
      },
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      active: false,
      disabled: false,
    },
  },
);

// A mouse-only affordance nested INSIDE the `role="tab"` button itself
// (never a sibling under `role="tablist"`, and never its own `role="button"`)
// — a real focusable/interactive element there would violate `role="tablist"`'s
// aria-required-children constraint (only `role="tab"` may live directly
// under it), confirmed by axe while writing this feature's own tests.
// Keyboard users close the focused tab with Delete/Backspace instead (see
// `onTablistKeydown`) — the same split the W3C ARIA Authoring Practices
// Guide's own "Tabs with Delete Buttons" example uses. No focus styling of
// its own (it's never a tab stop) — only a hover color shift.
export const tabsCloseButtonStyles =
  'ms-1 -me-1 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 text-text-muted ' +
  'transition-colors hover:bg-surface-200 hover:text-text-primary';
