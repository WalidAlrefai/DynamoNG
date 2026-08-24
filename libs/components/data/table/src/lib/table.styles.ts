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

// v4 reuses DynamoCheckbox directly (Table is tier:3, DynamoCheckbox is
// tier:0) instead of a hand-styled native checkbox — no local styles needed
// for the selection column beyond `tableSelectionCellStyles` above.

export const tablePaginationWrapperStyles =
  'flex items-center justify-between gap-4 border-t border-border px-4 py-2.5';

// --- v3: filtering ---

// Header bar above the `<table>`, symmetric to `tablePaginationWrapperStyles`'
// footer bar below it (`border-t` there, `border-b` here) — both live inside
// the same bordered/rounded `tableWrapperStyles` card.
export const tableFilterWrapperStyles =
  'flex items-center gap-2 border-b border-border px-4 py-2.5';

// v4 reuses DynamoInputText directly instead of a hand-styled native
// `<input type="search">` — no local filter-input styles needed anymore.
