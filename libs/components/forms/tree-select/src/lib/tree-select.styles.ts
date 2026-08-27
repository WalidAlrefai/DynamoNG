import { cva } from 'class-variance-authority';

// The only NEW Tailwind classes for this component live here — the trigger
// and panel-wrapper look are reused directly from `@dynamong/select`
// (`selectTriggerStyles`/`selectTriggerButtonStyles`/`selectChevronStyles`/
// `selectPanelWrapperStyles`), not redeclared. Only the tree row itself
// (indentation, expand chevron, selected/active highlight) is genuinely new.
export const treeSelectRowStyles = cva(
  'flex w-full cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-sm text-text-primary',
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
  'flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-surface-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

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
