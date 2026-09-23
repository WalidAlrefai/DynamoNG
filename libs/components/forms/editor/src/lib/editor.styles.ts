import { cva } from 'class-variance-authority';
import {
  focusRingClass,
  focusRingInvalidClass,
  focusRingWithinClass,
  overlayPanelClass,
} from '@dynamong/utils/styles';

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
      invalid: {
        // Tint the shared focus ring danger; the accent-coloured ring is the default.
        true: 'border-danger ' + focusRingInvalidClass,
        false: 'border-border',
      },
    },
    defaultVariants: { disabled: false, invalid: false },
  },
);

// flex-nowrap, not flex-wrap: overflow beyond the toolbar's width is now
// handled in JS (editor.ts's recomputeOverflow, via a "⋯" button), not by
// letting the row grow to a second line. The local overflow-hidden is a
// safety net against a stray few-px rounding difference poking a
// not-yet-hidden item into view — distinct from editorRootStyles' own
// overflow-hidden, which clips the whole component to its rounded corners.
export const editorToolbarStyles =
  'flex flex-nowrap items-center gap-1 overflow-hidden border-b border-border p-1.5';

// Native <select>, not cva()-varianted — it only has a disabled state, same
// shape as editorToolbarStyles above, not a multi-variant recipe like
// editorButtonStyles/editorContentStyles below. w-28 is a fixed width
// (previously auto-sized to the selected option's text, which visibly
// jiggled the toolbar between "Paragraph" and "Heading 1/2/3") — both a UX
// fix and a prerequisite for editor.ts's hardcoded-width overflow
// calculation, whose SELECT_WIDTH_PX constant must stay in sync with this.
export const editorHeadingSelectStyles =
  'h-7 w-28 shrink-0 rounded-sm border border-border bg-surface-0 px-1 text-sm text-text-primary ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  focusRingClass;

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
// `empty:before:content-[attr(data-placeholder)]` is the standard
// contenteditable-placeholder trick — a native <textarea>'s `placeholder`
// attribute has no contenteditable equivalent, so this renders the
// `data-placeholder` attribute's value as generated content only while the
// div has zero child nodes, exactly like a real placeholder disappearing on
// the first keystroke.
// The [&_h1]/[&_h2]/[&_h3] arbitrary variants are the same class of fix as
// the [&_ul]/[&_ol] one above — Tailwind's preflight resets heading
// font-size/weight/margin to inherit/unset, so without this
// execCommand('formatBlock', false, '<h1>') produces correct semantic
// <h1>/<h2>/<h3> markup that renders visually identical to body text.
// [&_img] caps an inserted (base64 data URI) image's width at the editor's
// own — an image can be arbitrarily large in pixel dimensions and would
// otherwise overflow the fixed-width container.
export const editorContentStyles = cva(
  'min-h-32 overflow-y-auto p-3 text-sm outline-none ' +
    '[&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6 ' +
    '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold ' +
    '[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold ' +
    '[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-semibold ' +
    '[&_img]:max-w-full [&_img]:h-auto ' +
    'empty:before:pointer-events-none empty:before:text-text-muted empty:before:content-[attr(data-placeholder)]',
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

// The overflow panel's content — a mix of toggle buttons and one native
// <select>, unlike @dynamong/menu's own homogeneous flat command list (see
// menuPanelStyles in libs/components/overlay/menu/src/lib/menu.styles.ts,
// whose overlayPanelClass base this reuses). Grid, not flex-col: each
// control naturally falls in column 1, its trailing label span (rendered
// only in the overflow location — see editor.html) naturally falls in
// column 2, with no extra wrapper element needed per row.
export const editorOverflowPanelStyles =
  'z-dropdown grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 p-1 ' +
  overlayPanelClass;

export const editorOverflowItemLabelStyles = 'text-sm text-text-primary';
