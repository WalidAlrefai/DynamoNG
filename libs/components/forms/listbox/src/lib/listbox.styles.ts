import { cva } from 'class-variance-authority';

export const listboxRootStyles =
  'max-h-72 overflow-auto rounded-md border border-border bg-surface-0 py-1';

// When virtualized, `@dynamong/virtual-scroll`'s own viewport (a fixed
// `height`) is the sole scrolling region — this root must NOT also
// constrain/scroll height, or two nested scrollable regions both activate
// at once (a "double scrollbar" bug). Also drops `py-1` so the viewport
// sits flush inside the `<ul>`. Same reasoning as
// `selectPanelWrapperVirtualStyles` in `@dynamong/select`.
export const listboxRootVirtualStyles =
  'rounded-md border border-border bg-surface-0';

export const listboxGroupHeadingStyles =
  'px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted';

export const listboxOptionStyles = cva(
  'flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-text-primary',
  {
    variants: {
      active: { true: 'bg-primary/10 text-primary', false: '' },
      selected: { true: 'bg-primary/10 text-primary font-semibold', false: '' },
      disabled: { true: 'cursor-not-allowed opacity-60', false: '' },
    },
    defaultVariants: { active: false, selected: false, disabled: false },
  },
);

// Mirrors MultiSelect's own panel-row checkbox: an empty bordered square
// that only shows the check glyph once selected.
export const listboxOptionCheckboxStyles = cva(
  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
  {
    variants: {
      checked: {
        true: 'border-primary bg-primary text-on-primary',
        false: 'border-border bg-surface-0',
      },
    },
    defaultVariants: { checked: false },
  },
);
