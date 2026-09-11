import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — never inline in org-chart.html / org-chart-item.html.

// The outer wrapper: a horizontally-scrollable viewport so a wide chart
// never forces the page itself to scroll sideways.
export const orgChartRootStyles =
  'inline-block max-w-full overflow-x-auto text-text-primary';

// The top row of root nodes. No connector above it — `justify-center`
// keeps a single root centred, a forest evenly spread.
export const orgChartTreeStyles = 'flex justify-center';

// A subtree row. `pt-6` opens the vertical band the connectors live in;
// `before:` draws the straight drop from the parent box down to the
// sibling bus.
export const orgChartGroupStyles =
  'relative flex justify-center pt-6 ' +
  'before:absolute before:left-1/2 before:top-0 before:h-6 before:w-px ' +
  "before:bg-border before:content-['']";

// One node and its subtree. Set on the `<dg-org-chart-item>` host so the
// `first:` / `last:` / `only:` sibling-position variants and the `before:` /
// `after:` connector pseudo-elements resolve against the real flex child.
//   - `before:` = left half of the horizontal bus above this node
//   - `after:`  = right half of the bus + the short drop to this node's box
//   - trims: no bus past the first/last child; none at all for a lone child
export const orgChartItemStyles =
  'relative flex flex-col items-center px-4 pt-6 ' +
  'before:absolute before:right-1/2 before:top-0 before:h-px before:w-1/2 ' +
  "before:bg-border before:content-[''] " +
  'after:absolute after:left-1/2 after:top-0 after:h-6 after:w-1/2 ' +
  "after:border-l after:border-t after:border-border after:content-[''] " +
  'first:before:hidden ' +
  'last:after:w-px ' +
  'only:before:hidden only:after:border-t-0';

export const orgChartBoxStyles = cva(
  'relative z-10 inline-flex flex-col items-stretch rounded-md border border-border ' +
    'bg-surface-0 px-4 py-2 text-sm text-text-primary ' +
    focusRingClass,
  {
    variants: {
      selectable: {
        true: 'cursor-pointer hover:bg-surface-50',
        false: '',
      },
      selected: {
        true: 'border-primary ring-2 ring-primary',
        false: '',
      },
    },
    defaultVariants: { selectable: false, selected: false },
  },
);

// The collapse affordance sits on the connector just below the node box. A
// click-only `<span aria-hidden>` (the keyboard path is Arrow keys on the
// focusable node box) — the same shape as `@dynamong/tree`'s chevron, so an
// interactive `<button>` never nests inside the `treeitem` widget.
export const orgChartTogglerStyles = cva(
  'relative z-20 -mt-3 flex h-6 w-6 cursor-pointer items-center justify-center ' +
    'rounded-full border border-border bg-surface-0 text-text-primary ' +
    'transition-transform duration-200 ease-out hover:bg-surface-100',
  {
    variants: {
      collapsed: {
        true: '',
        false: 'rotate-180',
      },
    },
    defaultVariants: { collapsed: false },
  },
);
