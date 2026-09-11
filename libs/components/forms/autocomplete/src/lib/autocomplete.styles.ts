import { cva } from 'class-variance-authority';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
} from '@dynamong/utils/styles';

// Own copy of input-text.styles.ts's shape — input-text.styles.ts isn't
// exported from @dynamong/input-text (only the component/types/harness
// are), so this can't be imported. The panel/listbox/group-heading/
// no-results/option styles below are NOT redeclared here — they're
// imported directly from @dynamong/select, which already exports them for
// exactly this kind of cross-component reuse (DynamoMultiSelect reuses the
// same ones).
export const autocompleteFieldStyles = cva(
  'block w-full rounded-md border bg-surface-0 text-text-primary transition-colors ' +
    'placeholder:text-text-muted ' +
    focusRingClass +
    ' disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: controlSizeVariants,
      invalid: {
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
      // Reserves trailing space so typed text doesn't collide with the
      // loading spinner absolutely positioned over the field (see
      // `autocompleteLoadingIndicatorStyles`).
      loading: {
        true: 'pe-8',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      loading: false,
    },
  },
);

// Positions the field's own wrapper so the loading spinner below can be
// absolutely placed over it — the field itself is a bare `<input>` with no
// room for child content, unlike Select/CascadeSelect/TreeSelect's
// `<button>` triggers, which just prepend the spinner as a child.
export const autocompleteFieldWrapperStyles = 'relative';
export const autocompleteLoadingIndicatorStyles =
  'pointer-events-none absolute end-2 top-1/2 -translate-y-1/2';
