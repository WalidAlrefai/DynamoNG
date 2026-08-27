export const confirmPanelStyles =
  'relative z-10 w-full max-w-sm rounded-lg border border-border bg-surface-0 p-6 shadow-lg focus:outline-none';

// Passed as CDK's `OverlayConfig.backdropClass`, not template-bound — CDK
// renders its own backdrop element rather than one in `confirm-container.html`.
export const confirmBackdropClass = 'bg-surface-900/50';
