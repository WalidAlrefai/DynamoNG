import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — table.html only ever binds `[class]="...Classes()"` or a
// plain exported string constant.
export const tableWrapperStyles =
  'w-full overflow-x-auto rounded-md border border-border';
export const tableStyles =
  'w-full border-collapse text-left text-sm text-text-primary';
export const tableHeaderRowStyles = 'border-b border-border bg-surface-50';

export const tableHeaderCellStyles = cva('font-medium text-text-muted', {
  variants: {
    size: {
      sm: 'px-3 py-1.5',
      md: 'px-4 py-2.5',
      lg: 'px-5 py-3.5',
    },
  },
  defaultVariants: { size: 'md' },
});

export const tableSortButtonStyles =
  'inline-flex items-center gap-1 rounded-sm font-medium text-text-muted transition-colors ' +
  'hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'focus-visible:ring-offset-2';

// Reuses Menu's rotate-on-state chevron pattern rather than a new icon
// asset — "none" dims it to signal sortable-but-inactive.
export const tableSortIconStyles = cva(
  'shrink-0 transition-transform duration-150 ease-out',
  {
    variants: {
      direction: {
        asc: 'rotate-180 text-text-primary',
        desc: 'rotate-0 text-text-primary',
        none: 'rotate-0 text-text-muted opacity-50',
      },
    },
    defaultVariants: { direction: 'none' },
  },
);

// `selected` variant added for v2 row selection. The component binds this
// per-row via a method (`bodyRowClasses(row)`), not a plain constant,
// since selection state varies row-to-row.
export const tableBodyRowStyles = cva(
  'border-b border-border last:border-b-0 hover:bg-surface-50',
  {
    variants: {
      selected: {
        true: 'bg-primary/10 hover:bg-primary/15',
        false: '',
      },
    },
    defaultVariants: { selected: false },
  },
);

export const tableBodyCellStyles = cva('text-text-primary', {
  variants: {
    size: {
      sm: 'px-3 py-1.5',
      md: 'px-4 py-2.5',
      lg: 'px-5 py-3.5',
    },
  },
  defaultVariants: { size: 'md' },
});

export const tableEmptyCellStyles = 'px-4 py-8 text-center text-text-muted';

// --- v2: pagination + selection ---

// Fixed-width, size-varying-padding-only column, shared by the header
// `<th>` and every body `<td>` in the selection column.
export const tableSelectionCellStyles = cva('w-10 text-center', {
  variants: {
    size: {
      sm: 'px-3 py-1.5',
      md: 'px-4 py-2.5',
      lg: 'px-5 py-3.5',
    },
  },
  defaultVariants: { size: 'md' },
});

// Native checkbox, not DynamoCheckbox's custom SVG box — Table
// (domain:data) can't depend on Checkbox (domain:forms) components across
// the module-boundary rule, and a plain native input gets keyboard/
// screen-reader operability for free. `accent-primary` resolves through
// the same `--dg-color-primary` token `bg-primary`/`text-primary` already
// use elsewhere.
export const tableCheckboxStyles = 'h-4 w-4 cursor-pointer accent-primary';

export const tablePaginationWrapperStyles =
  'flex items-center justify-between gap-4 border-t border-border px-4 py-2.5';

export const tablePageIndicatorStyles = 'text-sm text-text-muted';

// Mirrors tableSortButtonStyles' hover/focus-ring treatment, sized as a
// compact icon button matching DynamoDatePicker's Prev/Next-month nav
// buttons. Kept as its own standalone string rather than concatenated
// with tableSortButtonStyles: these exported class strings are bound
// directly via `[class]` and never piped through `cn()`/twMerge, so
// concatenating would leave conflicting utilities (this needs
// `rounded-md`; tableSortButtonStyles has `rounded-sm`) both present with
// no reliable resolution.
export const tablePaginationButtonStyles =
  'flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors ' +
  'hover:bg-surface-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
