const HEX6_PATTERN = /^#[0-9a-f]{6}$/i;
const HEX8_PATTERN = /^#[0-9a-f]{8}$/i;

/** The 6-digit `#rrggbb` RGB portion of `value`, dropping any alpha
 *  suffix. Falls back to `#000000` for anything that isn't a valid 6-
 *  or 8-digit hex — the same fallback `normalizedNativeColorValue`
 *  always used, now centralized here since `isSameColor` needs it too. */
export function rgbHexOf(value: string): string {
  if (HEX8_PATTERN.test(value)) return value.slice(0, 7);
  if (HEX6_PATTERN.test(value)) return value;
  return '#000000';
}

/** The alpha channel (0-1) encoded in an 8-digit hex string's trailing
 *  2 digits. Returns 1 (fully opaque) for a 6-digit hex or anything
 *  that isn't a valid 6/8-digit hex at all. */
export function alphaFromHexColor(value: string): number {
  if (!HEX8_PATTERN.test(value)) return 1;
  return parseInt(value.slice(7, 9), 16) / 255;
}

export function clampAlpha(alpha: number): number {
  return Math.min(1, Math.max(0, alpha));
}

/** Clamps a saturation/brightness ratio (or any other 0-1 quantity) into range. */
export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Rewrites `value`'s alpha channel to `alpha` (clamped), keeping its
 *  RGB portion. An alpha of exactly 1 produces a plain 6-digit hex —
 *  no redundant `ff` suffix — so toggling `showAlpha` off, or dragging
 *  the slider back to fully opaque, never leaves a stale 8-digit value
 *  behind. */
export function withAlpha(value: string, alpha: number): string {
  const rgb = rgbHexOf(value);
  const clamped = clampAlpha(alpha);
  if (clamped === 1) return rgb;
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return rgb + a;
}

export interface DynamoHsv {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clampByte(r), clampByte(g), clampByte(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** The current color's hue/saturation/brightness, derived from `value()`
 *  on every read — no separate persistent HSV state. This trades away one
 *  edge case: dragging saturation to 0 (pure gray) loses hue information,
 *  since gray canonically decodes to `h: 0` — the next hue-slider touch
 *  after that starts from red rather than whatever hue was selected
 *  before going gray. A well-known, widely-accepted tradeoff in simple
 *  color pickers; the alternative (a separate persistent `hue` signal
 *  reconciled with external `value()` changes via an effect) adds real
 *  sync complexity for this one edge case. */
export function hsvOf(value: string): DynamoHsv {
  const { r, g, b } = hexToRgb(rgbHexOf(value));
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

/** The opaque `#rrggbb` for a given hue/saturation/brightness. */
export function hexFromHsv(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
