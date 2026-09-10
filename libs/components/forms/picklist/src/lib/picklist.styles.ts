import { cva } from 'class-variance-authority';
import { focusRingClass, sectionHeadingBaseClass } from '@dynamong/utils/styles';

export const picklistRootStyles = 'flex items-start gap-3';

export const picklistPanelStyles =
  'flex max-h-80 w-64 flex-col overflow-hidden rounded-md border border-border bg-surface-0';

export const picklistPanelHeaderStyles =
  'flex items-center justify-between gap-2 border-b border-border px-3 py-2';

export const picklistPanelTitleStyles = sectionHeadingBaseClass;

export const picklistPanelListStyles = 'flex-1 overflow-auto py-1';

// Mirrors listboxOptionStyles verbatim (same active/selected/disabled shape),
// plus a `dragging` variant CDK's cdkDrag adds a class for.
export const picklistOptionStyles = cva(
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

// Mirrors listboxOptionCheckboxStyles/MultiSelect's own panel-row checkbox:
// an empty bordered square that only shows the check glyph once selected.
export const picklistOptionCheckboxStyles = cva(
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

export const picklistMoveButtonColumnStyles = 'flex flex-col gap-2 pt-8';

export const picklistReorderButtonRowStyles = 'flex items-center gap-1';

// Hand-rolled bare <button> chrome, same reasoning as Password's toggle
// button / Chips Input's remove-chip button — no @dynamong/button import
// (would force a tier bump for zero benefit here).
export const picklistButtonStyles =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border ' +
  'bg-surface-0 text-sm text-text-primary transition-colors hover:bg-surface-200 ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  focusRingClass;
