import { cva } from 'class-variance-authority';
import {
  focusRingClass,
  sectionHeadingBaseClass,
} from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — order-list.html only binds `[class]="...Classes()"`. Shapes
// adapted from `picklist.styles.ts` (OrderList is the single-panel half of
// Picklist).

export const orderListRootStyles =
  'flex max-h-96 w-72 flex-col overflow-hidden rounded-md border border-border bg-surface-0';

export const orderListHeaderStyles =
  'flex items-center justify-between gap-2 border-b border-border px-3 py-2';

export const orderListTitleStyles = sectionHeadingBaseClass;

export const orderListControlsStyles = 'flex items-center gap-1';

export const orderListListStyles = 'flex-1 overflow-auto py-1';

// Mirrors `picklistOptionStyles` / `listboxOptionStyles` — same
// active/selected/disabled shape.
export const orderListOptionStyles = cva(
  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-text-primary',
  {
    variants: {
      active: { true: 'bg-primary/10 text-primary', false: '' },
      selected: { true: 'bg-primary/10 text-primary font-semibold', false: '' },
      disabled: { true: 'cursor-not-allowed opacity-60', false: '' },
    },
    defaultVariants: { active: false, selected: false, disabled: false },
  },
);

export const orderListCheckboxStyles = cva(
  'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
  {
    variants: {
      checked: {
        true: 'border-primary bg-primary text-on-primary',
        false: 'border-border bg-surface-0',
      },
    },
    defaultVariants: { checked: false },
  },
);

// Hand-rolled bare `<button>` chrome — same reasoning as Picklist's own
// buttons (no `@dynamong/button` import, which would force a tier bump for
// zero benefit).
export const orderListButtonStyles =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border ' +
  'bg-surface-0 text-sm text-text-primary transition-colors hover:bg-surface-200 ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  focusRingClass;
