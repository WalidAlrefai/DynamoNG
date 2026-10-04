import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only NEW Tailwind classes for this component live here — the trigger
// and panel-wrapper look are reused directly from `@dynamong/select`
// (`selectTriggerStyles`/`selectTriggerButtonStyles`/`selectChevronStyles`/
// `selectPanelWrapperStyles`), not redeclared. Only the tree row itself
// (indentation, expand chevron, selected/active highlight) is genuinely new.
export const treeSelectRowStyles = cva(
  'flex w-full cursor-pointer items-center gap-1 rounded-sm px-2 py-1.5 text-sm text-text-primary',
  {
    variants: {
      active: {
        true: 'bg-surface-100',
        false: '',
      },
      selected: {
        true: 'font-medium text-primary',
        false: '',
      },
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: '',
      },
    },
    defaultVariants: { active: false, selected: false, disabled: false },
  },
);

export const treeSelectExpandButtonStyles =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-surface-200 ' +
  focusRingClass;

// Keeps leaf rows' labels aligned with branch rows' labels (which have an
// expand button occupying the same width).
export const treeSelectExpandSpacerStyles = 'h-5 w-5 shrink-0';

export const treeSelectExpandIconStyles = cva('transition-transform', {
  variants: {
    expanded: {
      true: 'rotate-90',
      false: '',
    },
  },
  defaultVariants: { expanded: false },
});

// `selectionMode="checkbox"`'s per-row indicator — deliberately decorative
// (`aria-hidden`, no native `<input>`), mirroring `DynamoSelect`'s/
// `DynamoMultiSelect`'s own `selectedIndicator="checkbox"` precedent rather
// than TreeSelect's sibling `DynamoTree`'s real `<dg-checkbox>`: a row here
// is `tabindex="-1"` and non-interactive (all keyboard handling lives on the
// trigger, see tree-select.ts), so a second independently-focusable native
// checkbox nested inside it would be a real a11y regression — the row's own
// `aria-checked` already conveys the state. Tri-state, unlike Select's
// binary version, since a branch can be indeterminate.
export const treeSelectCheckboxIndicatorStyles = cva(
  'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
  {
    variants: {
      state: {
        checked: 'bg-primary border-primary text-on-primary',
        indeterminate: 'bg-primary border-primary text-on-primary',
        unchecked: 'bg-surface-0 border-border text-transparent',
      },
    },
    defaultVariants: { state: 'unchecked' },
  },
);

export const treeSelectCheckboxIndeterminateDashStyles =
  'h-0.5 w-2 rounded-full bg-current';
