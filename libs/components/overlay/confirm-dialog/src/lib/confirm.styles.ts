import { cva } from 'class-variance-authority';

// `visible` drives the entrance/exit "pop" (scale+fade with a springy
// overshoot) — same treatment as Dialog's own `dialogPanelStyles`, since
// both are centered modal panels. See confirm-container.ts's constructor
// (entrance) and DynamoConfirmService.settle() (exit) for the animation
// state driving it.
// Tailwind v4 implements `scale-*`/`translate-*` as the separate `scale`/
// `translate` CSS properties (not `transform`), so all four must be listed
// or only the fade animates. Timing applies from the destination state, so
// `open` (in) and `closing` (out) each get their own; `closing`'s duration
// must stay in sync with DynamoConfirmService's CLOSE_DURATION_MS.
export const confirmPanelStyles = cva(
  'relative z-modal w-full max-w-sm rounded-lg border border-border bg-surface-0 p-6 shadow-lg focus:outline-none ' +
    'transition-[opacity,transform,translate,scale] motion-reduce:transition-none',
  {
    variants: {
      phase: {
        opening: 'translate-y-6 scale-75 opacity-0',
        open: 'translate-y-0 scale-100 opacity-100 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        closing: 'translate-y-2 scale-95 opacity-0 duration-200 ease-in',
      },
    },
    defaultVariants: { phase: 'opening' },
  },
);

// Passed as CDK's `OverlayConfig.backdropClass`, not template-bound — CDK
// renders its own backdrop element rather than one in `confirm-container.html`.
// An array, not one space-joined string — CDK applies each entry via a
// single-token `classList.add()` call, which throws
// `InvalidCharacterError` on a string containing spaces.
// Starts hidden; DynamoConfirmService toggles between the visible/hidden
// class below directly on `OverlayRef.backdropElement`, since CDK's own
// backdrop-fade CSS isn't loaded anywhere in this app.
export const confirmBackdropClass = [
  'bg-surface-900/50',
  'opacity-0',
  'transition-opacity',
  'duration-200',
  'motion-reduce:transition-none',
];
export const confirmBackdropVisibleClass = 'opacity-100';
export const confirmBackdropHiddenClass = 'opacity-0';
