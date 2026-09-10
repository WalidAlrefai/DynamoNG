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
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  },
);
