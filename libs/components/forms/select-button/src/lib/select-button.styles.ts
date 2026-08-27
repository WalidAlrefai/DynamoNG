import { cva } from 'class-variance-authority';

// Root is a plain flex row; the "joined segmented control" look comes
// entirely from each segment's own rounding/overlap below, mirroring
// Pagination's division of labor (color is Button's job via severity/variant,
// this file only ever contributes shape/position via styleClass).
export const selectButtonRootStyles = 'inline-flex';

// A bare `border` lives in the base classes so every segment reserves the
// same 1px regardless of selection state — DynamoButton's own `outline`
// variant (unselected) already draws a real border of that width, but its
// `solid` variant (selected) draws none at all, which would otherwise shrink
// the selected segment's rendered box by ~2px (it's `inline-flex` with no
// explicit width, so removing a border shrinks the whole element, not just
// its content area). `selected: true` makes that reserved border transparent
// instead of removing it, keeping every segment's footprint identical.
export const selectButtonSegmentStyles = cva(
  'relative rounded-none border focus-visible:z-10',
  {
    variants: {
      position: {
        first: 'rounded-l-md',
        middle: '',
        last: 'rounded-r-md',
        only: 'rounded-md',
      },
      isNotFirst: {
        true: '-ml-px',
        false: '',
      },
      selected: {
        true: 'border-transparent',
        false: '',
      },
    },
    defaultVariants: { position: 'middle', isNotFirst: true, selected: false },
  },
);

export function selectButtonSegmentPosition(
  index: number,
  count: number,
): 'first' | 'middle' | 'last' | 'only' {
  if (count === 1) return 'only';
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return 'middle';
}
