import { cva } from 'class-variance-authority';
import { focusRingInsetClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — never inline in panel-menu.html/panel-menu-node.html.
export const panelMenuRootStyles = 'flex flex-col gap-0.5 rounded-md';

// Rows are real DOM focus targets (roving tabindex, like Tree's own rows) —
// `active` is a real, JS-driven visual variant rather than relying on
// :focus-visible alone, same idiom as Tree's treeRowStyles.
export const panelMenuRowStyles = cva(
  'flex w-full items-center gap-1.5 rounded-md py-1.5 pe-2 text-start text-sm text-text-primary ' +
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

export const panelMenuChevronStyles = cva(
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

export const panelMenuChevronPlaceholderStyles = 'inline-block h-4 w-4 shrink-0';

export const panelMenuLabelStyles = 'truncate';

// The 0fr/1fr CSS grid-rows trick — copied verbatim from Tree's own
// treeGroupStyles (itself copied from Accordion's content wrapper, then
// Panel's) — animates from zero to a subtree's intrinsic height without
// ResizeObserver or JS measurement. The 4th independent copy of this
// technique in this codebase; each component keeps its own copy with its
// own comment rather than a shared mixin.
export const panelMenuGroupStyles = cva(
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

export const panelMenuGroupInnerStyles = 'overflow-hidden min-h-0';

// A node's indentation is proportional to an unbounded integer depth, not a
// discrete set of variants cva can express — the same exception Tree's own
// treeIndentRem makes (independently duplicated here, not imported, since
// Tree doesn't export it and this codebase's menu/tree-family components
// each keep their own copy of small helpers like this).
export function panelMenuIndentRem(depth: number): number {
  return depth * 1.25;
}
