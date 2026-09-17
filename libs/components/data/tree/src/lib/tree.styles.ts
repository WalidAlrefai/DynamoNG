import { cva } from 'class-variance-authority';
import { focusRingInsetClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — never inline in tree.html/tree-item.html.

// The outer wrapper — the mergeable-with-styleClass()/unstyled() element.
// A visual no-op on its own (Tree ships border-less by default, unlike
// Table's/TreeTable's bordered-card wrapper styles) — just a hook for a
// consumer's own styleClass border/background to round against.
export const treeWrapperStyles = 'rounded-md';

// The inner `role="tree"` element's own row-stacking layout — plain,
// non-overridable (bound directly, never merged with styleClass()),
// mirroring Table's own tableStyles/tableClasses split: unstyled() now
// only strips the WRAPPER's classes, never this layout.
export const treeStyles = 'flex flex-col gap-0.5';

// Shown in place of the item list when `items()` is empty — a loading spin
// + message while `loading` is true, or `emptyStateMessage()` otherwise.
export const treeEmptyStateStyles =
  'flex items-center justify-center gap-2 px-4 py-8 text-sm text-text-muted';

// Header bar above the tree body, shown only while `filterable()` is true.
// Deliberately has no `border-b` — unlike Table's/TreeTable's own
// `*FilterWrapperStyles` (which pair a border-b against their bordered
// card's own border/border-t footer), Tree has no bordered card to pair a
// rule against; a lone border here would be the only one anywhere in the
// component. Spacing alone (bottom padding) separates it from the tree body.
export const treeFilterWrapperStyles = 'flex items-center gap-2 pb-2';

export const treeRowStyles = cva(
  'flex items-center gap-1.5 rounded-md py-1.5 pe-2 text-sm text-text-primary ' +
    focusRingInsetClass,
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
