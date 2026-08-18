import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — accordion.html only ever binds `[class]="...Classes()"`.
export const accordionRootStyles = 'flex flex-col gap-2';

export const accordionPanelStyles = cva(
  'overflow-hidden rounded-md border border-border bg-surface-0',
  {
    variants: {
      disabled: {
        true: 'opacity-60',
        false: '',
      },
    },
    defaultVariants: { disabled: false },
  },
);

export const accordionHeaderStyles = cva(
  'flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium ' +
    'transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      // `text-*` lives only here (not in the base string above) so exactly
      // one color utility is ever present — two same-specificity classes on
      // one element let stylesheet source order silently decide the winner.
      expanded: {
        true: 'text-primary',
        false: 'text-text-primary',
      },
      disabled: {
        true: 'pointer-events-none cursor-not-allowed',
        false: 'cursor-pointer hover:text-primary',
      },
    },
    defaultVariants: { expanded: false, disabled: false },
  },
);

export const accordionChevronStyles = cva(
  'shrink-0 transition-transform duration-200 ease-out',
  {
    variants: {
      expanded: {
        true: 'rotate-180',
        false: '',
      },
    },
    defaultVariants: { expanded: false },
  },
);

// The 0fr/1fr grid-rows trick: a single-row grid track animates from zero to
// intrinsic content height without ResizeObserver or JS measurement.
export const accordionContentWrapperStyles = cva(
  'grid transition-[grid-template-rows] duration-200 ease-out',
  {
    variants: {
      expanded: {
        true: 'grid-rows-[1fr]',
        false: 'grid-rows-[0fr]',
      },
    },
    defaultVariants: { expanded: false },
  },
);

export const accordionContentInnerStyles = 'overflow-hidden min-h-0';
export const accordionContentBodyStyles =
  'px-4 pb-4 pt-0 text-sm text-text-primary';
