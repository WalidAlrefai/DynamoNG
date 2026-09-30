import { cva } from 'class-variance-authority';
import { focusRingClass, focusRingInvalidClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — textarea.html only ever binds `[class]="textareaClasses()"`.
export const textareaStyles = cva(
  'block rounded-md border text-text-primary transition-colors ' +
    'placeholder:text-text-muted ' +
    focusRingClass +
    ' disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      // Multi-line vertical sizing — `min-h-*` + `py-*`, distinct from the
      // fixed-height `controlSizeVariants` triad.
      size: {
        sm: 'min-h-16 px-3 py-1.5 text-sm',
        md: 'min-h-20 px-4 py-2 text-base',
        lg: 'min-h-24 px-5 py-2.5 text-lg',
      },
      invalid: {
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
      variant: {
        outlined: 'bg-surface-0',
        filled: 'bg-surface-100 border-transparent',
      },
      fluid: {
        true: 'w-full',
        false: '',
      },
      // Manual resizing and autoResize's own height management fight each
      // other, so the drag handle is disabled whenever autoResize is on.
      // `max-h-96` bounds the default growth — `resize()` in textarea.ts
      // already reads this via `getComputedStyle().maxHeight` and clamps
      // against it, so this closes a real "grows without limit by default"
      // gap with zero logic changes; a consumer's own `max-h-*` via
      // `styleClass`/`pt.textarea.class` still overrides it through `cn()`.
      autoResize: {
        true: 'resize-none overflow-hidden max-h-96',
        false: 'resize-y',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      variant: 'outlined',
      fluid: true,
      autoResize: false,
    },
  },
);
