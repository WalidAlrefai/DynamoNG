import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — tabs.html only ever binds `[class]="...Classes()"`.
export const tabsRootStyles = 'flex flex-col gap-2';
export const tabsTablistRowStyles = 'flex items-center gap-2';
export const tabsTablistStyles = cva(
  'flex items-center gap-1 border-b border-border',
  {
    variants: {
      scrollable: {
        true: 'flex-nowrap overflow-x-auto',
        false: 'flex-wrap',
      },
    },
    defaultVariants: { scrollable: false },
  },
);
export const tabsPanelStyles =
  'pt-4 text-text-primary focus-visible:outline-none';

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

export const tabsTabStyles = cva(
  '-mb-px inline-flex items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-4 py-2 ' +
    'text-sm font-medium transition-colors ' +
    focusRingClass,
  {
    variants: {
      active: {
        true: 'border-primary text-primary',
        false: 'border-transparent text-text-muted hover:text-text-primary',
      },
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: { active: false, disabled: false },
  },
);
