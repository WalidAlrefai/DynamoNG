import { cva } from 'class-variance-authority';

// The only NEW Tailwind classes for this component live here — the trigger
// and panel-wrapper look are reused directly from `@dynamong/select`
// (`selectTriggerStyles`/`selectTriggerButtonStyles`/`selectChevronStyles`/
// `selectPanelWrapperStyles`), not redeclared, same precedent as TreeSelect.
// Only the row itself (active/selected highlight) and its trailing caret
// (shown on branch rows only, always pointing the same way — there's no
// expand/collapse toggle state here, since a click always drills in) are
// genuinely new.
export const cascadeSelectRowStyles = cva(
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm text-text-primary',
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

export const cascadeSelectCaretStyles = 'h-4 w-4 shrink-0 text-text-muted';

// Verbatim port of `treeSelectCheckboxIndicatorStyles`/
// `treeSelectCheckboxIndeterminateDashStyles` (`tree-select.styles.ts`) —
// decorative, `aria-hidden` indicator only, never a real focusable
// checkbox, same reasoning as TreeSelect's own round (rows here are
// `tabindex="-1"`/mouse-only, same as TreeSelect's own `treeitem` rows).
export const cascadeSelectCheckboxIndicatorStyles = cva(
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

export const cascadeSelectCheckboxIndeterminateDashStyles =
  'h-0.5 w-2 rounded-full bg-current';
