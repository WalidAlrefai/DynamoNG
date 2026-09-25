import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — dialog.html only ever binds `[class]="...Classes()"`.
//
// Tailwind v4 implements `scale-*`/`translate-*` as the separate `scale`/
// `translate` CSS properties (not `transform`), so all four must be listed
// or only the fade animates and the pop snaps.
//
// The transition timing applies from the *destination* state's classes, so
// entering (`open`) and leaving (`closing`) each get their own: a slower
// springy overshoot in, a quicker plain ease out. The `closing` duration
// must stay in sync with dialog.ts's CLOSE_DURATION_MS.
export const dialogPanelStyles = cva(
  'relative z-modal max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-surface-0 p-6 shadow-lg ' +
    // Always re-enables pointer events on the panel itself, since the root
    // wrapper (dialog.html) is made `pointer-events-none` while `modal` is
    // false, to let clicks reach the rest of the page around it.
    'pointer-events-auto focus:outline-none ' +
    'transition-[opacity,transform,translate,scale] motion-reduce:transition-none',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
      },
      phase: {
        opening: 'translate-y-6 scale-75 opacity-0',
        open: 'translate-y-0 scale-100 opacity-100 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        closing: 'translate-y-2 scale-95 opacity-0 duration-200 ease-in',
      },
    },
    defaultVariants: { size: 'md', phase: 'opening' },
  },
);

// Must stay in sync with dialog.ts's CLOSE_DURATION_MS.
export const dialogBackdropStyles = cva(
  'fixed inset-0 bg-surface-900/50 transition-opacity duration-200 motion-reduce:transition-none',
  {
    variants: {
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: { visible: false },
  },
);

export const dialogCloseButtonStyles =
  'inline-flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors ' +
  'hover:bg-surface-100 hover:text-text-primary ' +
  focusRingClass;
