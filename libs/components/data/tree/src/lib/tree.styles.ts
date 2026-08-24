import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — never inline in tree.html/tree-item.html.
export const treeRootStyles = 'flex flex-col gap-0.5 rounded-md';

export const treeRowStyles = cva(
  'flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm text-text-primary ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      active: {
        true: 'bg-surface-100',
        false: '',
      },
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: 'cursor-pointer hover:bg-surface-50',
      },
    },
    defaultVariants: { active: false, disabled: false },
  },
);

export const treeChevronButtonStyles =
  'flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center';

export const treeChevronStyles = cva(
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

export const treeChevronPlaceholderStyles = 'inline-block h-4 w-4 shrink-0';

export const treeLabelStyles = 'truncate';

// The 0fr/1fr CSS grid-rows trick (same technique as Accordion's content
// wrapper): animates from zero to a subtree's intrinsic height without
// ResizeObserver or JS measurement.
export const treeGroupStyles = cva(
  'grid transition-[grid-template-rows] duration-200 ease-out',
  {
    variants: {
      expanded: {
        true: 'grid-rows-[1fr]',
        false: 'grid-rows-[0fr]',
      },
    },
    defaultVariants: { expanded: false },
  },
);

export const treeGroupInnerStyles = 'overflow-hidden min-h-0';

// A node's indentation is proportional to an unbounded integer depth, not a
// discrete set of variants cva can express — the same kind of exception as
// Progress's fill-width binding. `[style.paddingLeft.rem]` in tree-item.html
// binds this directly instead of a class.
export function treeIndentRem(depth: number): number {
  return depth * 1.25;
}
