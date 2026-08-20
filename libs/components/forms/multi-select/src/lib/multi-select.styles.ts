import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — multi-select.html only ever binds `[class]="...Classes()"`.
// The panel/option/group/filter chrome (`selectListboxStyles`,
// `selectOptionStyles`, `selectGroupHeadingStyles`, `selectFilterWrapperStyles`,
// `selectNoResultsStyles`, `selectChevronStyles`) is imported directly from
// `@dynamong/select` rather than redeclared here — structurally identical
// between single- and multi-select. Only the trigger (which wraps tag pills
// instead of one label, `flex-wrap` instead of a single line) and the tag
// pills themselves are genuinely different and get their own styles below.
export const multiSelectTriggerStyles = cva(
  'flex w-full flex-wrap items-center gap-1.5 rounded-md border bg-surface-0 ' +
    'text-text-primary transition-colors focus-within:ring-2 focus-within:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'min-h-8 px-2 py-1 text-sm',
        md: 'min-h-10 px-3 py-1.5 text-base',
        lg: 'min-h-12 px-4 py-2 text-lg',
      },
      invalid: {
        true: 'border-danger focus-within:ring-danger',
        false: 'border-border focus-within:ring-ring',
      },
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

// Unlike `DynamoSelect`, the wrapper itself carries `role="combobox"`
// (rather than an inner `<button>`) — each tag's remove control is a real
// `<button>`, and a `<button>` can't legally contain another `<button>`,
// so there's no inner semantic button to split out here; the div wrapper
// *is* the combobox, made focusable/keyboard-operable via `tabindex`.
export const multiSelectPlaceholderStyles = 'text-text-muted';

// Mirrors `chipStyles`' shape (rounded-full pill) but simplified — tags need
// only one neutral look, not Chip's full severity/variant matrix.
export const multiSelectTagStyles =
  'inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-text-primary';

export const multiSelectOverflowTagStyles =
  'inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-text-muted';

// Mirrors `chipRemoveButtonStyles`'s `hover:bg-current/10` trick.
export const multiSelectTagRemoveButtonStyles =
  '-mr-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 ' +
  'transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-1';

// Holds the optional select-all checkbox + filter field in one row —
// matches PrimeNG's MultiSelect header (a single tri-state checkbox
// followed by the filter input), not two separate "Select all"/"Clear all"
// buttons. Same border/padding language as `selectFilterWrapperStyles`,
// plus `flex` since this row can have two children instead of one.
export const multiSelectHeaderRowStyles =
  'flex items-center gap-2 border-b border-border p-2';

// A decorative-only check indicator, NOT `<dg-checkbox>` — that component's
// native `<input>` is independently focusable (Tab-reachable), which would
// add a phantom tab stop inside each `role="option"` <li> and break the
// listbox's single-tab-stop/virtual-focus model. Mirrors
// `checkboxBoxStyles`'s visual (`libs/components/forms/checkbox`) at a
// fixed `sm` size, rendered with the real `DynamoCheckIcon` (a stateless,
// non-focusable icon component, `type:core`, freely importable).
export const multiSelectOptionCheckboxStyles = cva(
  'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
  {
    variants: {
      checked: {
        true: 'bg-primary border-primary text-on-primary',
        false: 'bg-surface-0 border-border text-transparent',
      },
    },
    defaultVariants: { checked: false },
  },
);

export const multiSelectMaxSelectedMessageStyles =
  'border-t border-border px-4 py-1.5 text-xs text-text-muted';
