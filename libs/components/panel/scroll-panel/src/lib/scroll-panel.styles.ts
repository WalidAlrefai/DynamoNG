import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — scroll-panel.html only ever binds `[class]="...Classes"`,
// except each thumb's `[style]` (continuous size/position that no discrete
// variant could express) — the same "deliberate inline-style exception"
// pattern used by Splitter's panelStyle()/dividerStyle().
export const scrollPanelRootStyles = 'relative';

// `dg-scrollbar-hidden` is a shared `@utility` in the tailwind-preset
// package (see preset.css) — hides the native scrollbar cross-browser
// while leaving native scrolling itself untouched.
export const scrollPanelContentStyles =
  'block h-full w-full overflow-auto dg-scrollbar-hidden ' + focusRingClass;

export const scrollPanelThumbYStyles =
  'absolute end-0.5 top-0 w-1.5 rounded-full bg-text-muted/40 transition-colors hover:bg-text-muted/60';
export const scrollPanelThumbXStyles =
  'absolute bottom-0.5 start-0 h-1.5 rounded-full bg-text-muted/40 transition-colors hover:bg-text-muted/60';
