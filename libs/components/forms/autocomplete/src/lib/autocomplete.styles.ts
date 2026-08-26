import { cva } from 'class-variance-authority';

// Own copy of input-text.styles.ts's shape — input-text.styles.ts isn't
// exported from @dynamong/input-text (only the component/types/harness
// are), so this can't be imported. The panel/listbox/group-heading/
// no-results/option styles below are NOT redeclared here — they're
// imported directly from @dynamong/select, which already exports them for
// exactly this kind of cross-component reuse (DynamoMultiSelect reuses the
// same ones).
export const autocompleteFieldStyles = cva(
  'block w-full rounded-md border bg-surface-0 text-text-primary transition-colors ' +
    'placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-5 text-lg',
      },
      invalid: {
        true: 'border-danger focus-visible:ring-danger',
        false: 'border-border focus-visible:ring-ring',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  },
);
