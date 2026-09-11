import { cva } from 'class-variance-authority';
import { focusRingClass, focusRingWithinClass } from '@dynamong/utils/styles';

// Outer wrapper: focus visually belongs to the whole control (toolbar +
// content), not one native input, so it reacts to focus-within the same way
// Password's wrapper does across its input + toggle button.
export const editorRootStyles = cva(
  'flex flex-col overflow-hidden rounded-md border bg-surface-0 text-text-primary ' +
    'transition-colors ' +
    focusRingWithinClass,
  {
    variants: {
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { disabled: false },
  },
);

export const editorToolbarStyles =
  'flex flex-wrap items-center gap-1 border-b border-border p-1.5';

// Hand-rolled <button> chrome, near-identical to passwordToggleButtonStyles
// — no @dynamong/button import (would force a tier bump for zero benefit
// here). `active` is a genuinely new variant (Password's toggle has no
// "pressed" state to copy) but follows the exact same cva() boolean-variant
// idiom as InputText's `invalid` variant.
export const editorButtonStyles = cva(
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-sm text-text-muted ' +
    'transition-colors hover:bg-surface-200 hover:text-text-primary ' +
    'disabled:pointer-events-none disabled:opacity-40 ' +
    focusRingClass,
  {
    variants: {
      active: {
        true: 'bg-surface-300 text-text-primary',
        false: '',
      },
    },
    defaultVariants: { active: false },
  },
);

// The contenteditable surface itself. No native :disabled pseudo-class to
// lean on (contenteditable isn't a form control), so disabled styling is an
// explicit variant here, same reasoning Password's wrapper has its own.
// The [&_ul]/[&_ol] arbitrary variants restore list markers Tailwind's own
// preflight strips (list-style: none on every ul/ol by default) — without
// this, execCommand('insertUnorderedList'/'insertOrderedList') produces
// correct semantic <ul>/<li> markup that renders with no visible bullet at
// all, discovered live rather than caught by any unit test (jsdom doesn't
// apply CSS).
export const editorContentStyles = cva(
  'min-h-32 overflow-y-auto p-3 text-sm outline-none ' +
    '[&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6',
  {
    variants: {
      disabled: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: { disabled: false },
  },
);
