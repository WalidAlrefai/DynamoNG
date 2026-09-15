/** Pixel floor below which a thumb becomes too small to comfortably grab. */
export const MIN_THUMB_PX = 24;

/** Fade zone size for the edge mask hint, in pixels. */
export const FADE_SIZE_PX = 24;

export interface ThumbGeometry {
  /** Thumb length along the track, in pixels — clamped to `minThumbPx`. */
  sizePx: number;
  /** Thumb length as a percentage of the track. */
  sizePct: number;
  /** Thumb start offset as a percentage of the track. */
  posPct: number;
}

/**
 * Computes a scrollbar thumb's size and position along one axis, clamping
 * the raw ratio-based size to `minThumbPx` so it never shrinks to an
 * ungrabbable sliver on very long content. `posPct` is scaled into the
 * remaining (100% - sizePct) track space once the clamp is applied, so
 * position and (clamped) size always agree — including during drag, which
 * must use the same clamped `sizePx` for its travel-distance math.
 */
export function computeThumbGeometry(
  trackLengthPx: number,
  clientSizePx: number,
  scrollSizePx: number,
  scrollPos: number,
  minThumbPx: number,
): ThumbGeometry {
  const rawSizePx =
    scrollSizePx > 0
      ? (clientSizePx / scrollSizePx) * trackLengthPx
      : trackLengthPx;
  const sizePx = Math.max(rawSizePx, Math.min(minThumbPx, trackLengthPx));
  const sizePct = trackLengthPx > 0 ? (sizePx / trackLengthPx) * 100 : 100;
  const maxScrollPos = scrollSizePx - clientSizePx;
  const posPct =
    maxScrollPos > 0 ? (scrollPos / maxScrollPos) * (100 - sizePct) : 0;
  return { sizePx, sizePct, posPct };
}

/**
 * Builds a `mask-image` linear-gradient fading whichever edges have more
 * (currently scrolled-past) content beyond them. Returns `null` when
 * neither edge needs a fade, so callers can omit the mask entirely.
 */
export function buildFadeGradient(
  fadeStart: boolean,
  fadeEnd: boolean,
  direction: 'to bottom' | 'to right',
  fadeSizePx: number = FADE_SIZE_PX,
): string | null {
  if (!fadeStart && !fadeEnd) {
    return null;
  }
  const stops = [
    fadeStart ? 'transparent 0' : 'black 0',
    fadeStart ? `black ${fadeSizePx}px` : null,
    fadeEnd ? `black calc(100% - ${fadeSizePx}px)` : null,
    fadeEnd ? 'transparent 100%' : 'black 100%',
  ].filter((stop): stop is string => stop !== null);
  return `linear-gradient(${direction}, ${stops.join(', ')})`;
}
