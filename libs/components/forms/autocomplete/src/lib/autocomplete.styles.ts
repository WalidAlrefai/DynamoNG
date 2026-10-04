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
  'block rounded-md border bg-surface-0 text-text-primary transition-colors ' +
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
      fluid: {
        true: 'w-full',
        false: '',
      },
      // Reserves trailing space so typed text doesn't collide with the
      // loading spinner or the clearable (×) button, both absolutely
      // positioned over the field in the same trailing slot (see
      // `autocompleteLoadingIndicatorStyles`) — never shown simultaneously
      // (the clear button hides itself while loading), but either one
      // alone still needs the same reserved space.
      trailingIcon: {
        true: 'pe-8',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      fluid: true,
      trailingIcon: false,
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
// Mirrors `input-text.html`'s own inline clear-button classes exactly — the
// closest architectural precedent (a bare `<input>` field, not a button
// trigger), not `DynamoSelect`'s own `clearable`.
export const autocompleteClearButtonStyles =
  'absolute inset-y-0 end-0 flex items-center pe-2 text-text-muted hover:text-text-primary';
