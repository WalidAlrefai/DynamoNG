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
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-text-primary',
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
