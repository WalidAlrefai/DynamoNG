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
  'absolute end-0.5 top-0 w-2 rounded-full bg-text-muted/40 transition-colors hover:bg-text-muted/60';
export const scrollPanelThumbXStyles =
  'absolute bottom-0.5 start-0 h-2 rounded-full bg-text-muted/40 transition-colors hover:bg-text-muted/60';

// Invisible, wider-than-the-thumb click targets spanning the full track —
// rendered as siblings *before* their matching thumb in the template so
// the thumb (painted later, same stacking context) always wins hit-testing
// over the parts of the track it visually covers; no stopPropagation needed.
export const scrollPanelTrackYStyles = 'absolute inset-y-0 end-0 w-3';
export const scrollPanelTrackXStyles = 'absolute inset-x-0 bottom-0 h-3';
