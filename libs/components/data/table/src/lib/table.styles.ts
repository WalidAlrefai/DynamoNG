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

export const tableBodyRowStyles =
  'border-b border-border last:border-b-0 hover:bg-surface-50';

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
