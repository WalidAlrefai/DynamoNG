import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — tree-table.html only ever binds `[class]="...Classes()"` or
// a plain exported string constant.
export const treeTableRootStyles =
  'w-full overflow-x-auto rounded-md border border-border';
export const treeTableStyles =
  'w-full border-collapse text-start text-sm text-text-primary';
export const treeTableHeaderRowStyles = 'border-b border-border bg-surface-50';

export const treeTableHeaderCellStyles =
  'px-4 py-2.5 font-medium text-text-muted';

export const treeTableSortButtonStyles =
  'inline-flex items-center gap-1 rounded-sm font-medium text-text-muted transition-colors ' +
  'hover:text-text-primary ' +
  focusRingClass;

// Copied from Table's own tableSortIconStyles shape — "none" dims the icon
// to signal sortable-but-inactive.
export const treeTableSortIconStyles = cva(
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

// Rows are real focus targets (roving tabindex, like Tree's own rows) —
// `active` is a real, JS-driven visual variant rather than relying on
// :focus-visible alone, same idiom as Tree's treeRowStyles.
export const treeTableRowStyles = cva(
  'border-b border-border last:border-b-0',
  {
    variants: {
      active: {
        true: 'bg-surface-100',
        false: '',
      },
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: 'hover:bg-surface-50',
      },
    },
    defaultVariants: { active: false, disabled: false },
  },
);

export const treeTableCellStyles = 'px-4 py-2.5 text-text-primary';
export const treeTableEmptyCellStyles = 'px-4 py-8 text-center text-text-muted';

export const treeTableChevronButtonStyles =
  'flex h-4 w-4 shrink-0 items-center justify-center';

// Copied from Tree's own treeChevronStyles shape.
export const treeTableChevronStyles = cva(
  'shrink-0 transition-transform duration-200 ease-out',
  {
    variants: {
      expanded: {
        true: 'rotate-180',
        false: '',
      },
    },
    defaultVariants: { expanded: false },
  },
);

export const treeTableChevronPlaceholderStyles =
  'inline-block h-4 w-4 shrink-0';

export const treeTableFirstCellContentStyles = 'flex items-center gap-1.5';

// A node's indentation is proportional to an unbounded integer depth, not a
// discrete set of variants cva can express — the same exception Tree's own
// treeIndentRem makes (independently duplicated here, matching PanelMenu's
// own duplication of the same helper).
export function treeTableIndentRem(depth: number): number {
  return depth * 1.25;
}
