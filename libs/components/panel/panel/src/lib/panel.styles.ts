import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — panel.html only ever binds `[class]="...Classes()"`.
// Variant axis copied from cardStyles — Panel is visually the same content-
// container family as Card, differing only in its built-in collapse toggle.
export const panelStyles = cva('overflow-hidden rounded-lg text-text-primary', {
  variants: {
    variant: {
      elevated: 'bg-surface-0 shadow-md',
      outlined: 'border border-border bg-surface-0',
      filled: 'bg-surface-100',
    },
  },
  defaultVariants: { variant: 'elevated' },
});

// Plain div when not collapsible, a `<button>` when it is — same base shape
// either way (near-identical to cardHeaderStyles).
export const panelHeaderStyles =
  'flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-left';
export const panelHeaderButtonStyles =
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset hover:text-primary';
export const panelTitleStyles = 'text-base font-semibold text-text-primary';

// The 0fr/1fr grid-rows trick, copied verbatim from Accordion
// (accordionContentWrapperStyles) — a single-row grid track animates from
// zero to intrinsic content height without ResizeObserver or JS measurement.
export const panelContentWrapperStyles = cva(
  'grid transition-[grid-template-rows] duration-200 ease-out',
  {
    variants: {
      expanded: {
        true: 'grid-rows-[1fr]',
        false: 'grid-rows-[0fr]',
      },
    },
    defaultVariants: { expanded: true },
  },
);

export const panelContentInnerStyles = 'overflow-hidden min-h-0';
export const panelContentBodyStyles = 'p-4';

// Copied from accordionChevronStyles.
export const panelChevronStyles = cva('shrink-0 transition-transform duration-200 ease-out', {
  variants: {
    expanded: {
      true: 'rotate-180',
      false: '',
    },
  },
  defaultVariants: { expanded: true },
});
