import {
  alphaFromHexColor,
  hexFromHsv,
  hexToRgb,
  hsvOf,
  rgbHexOf,
  rgbToHex,
  withAlpha,
} from './color-picker.color';

/**
 * `value` stays a plain string under every format here (not an
 * `{r,g,b}`/`{h,s,b}` object) — this codebase binds every CVA value as a
 * string, and the trigger's own `[style.background-color]` needs a
 * string regardless.
 */
export type DynamoColorPickerFormat = 'hex' | 'rgb' | 'hsb';

// Loose on whitespace, strict on structure — classic comma-separated CSS
// function syntax only (`rgb(255, 0, 0)` / `rgba(255, 0, 0, 0.5)`), not the
// modern space-separated syntax; matches how little this codebase's other
// parsers (e.g. the hex regexes in color-picker.color.ts) try to accept.
const RGB_PATTERN =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i;
const HSB_PATTERN =
  /^hsba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i;

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampAlphaValue(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** `rgb(r, g, b)`, or `rgba(r, g, b, a)` when `hex` itself carries an
 *  8-digit alpha suffix — mirrors `withAlpha`'s own "no stray suffix when
 *  opaque" convention, just for the rgb() notation instead of hex. Falls
 *  back to `rgb(0, 0, 0)` for anything that isn't a valid hex (matching
 *  `rgbHexOf`'s own `#000000` fallback). */
export function rgbStringOf(hex: string): string {
  const { r, g, b } = hexToRgb(rgbHexOf(hex));
  const alpha = alphaFromHexColor(hex);
  if (alpha === 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The reverse of `rgbStringOf` — `null` for anything that doesn't match
 *  `rgb(...)`/`rgba(...)`, so callers can fall back the same way
 *  `rgbHexOf` already does for malformed hex. */
export function hexFromRgbString(value: string): string | null {
  const match = RGB_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, r, g, b, a] = match;
  const hex = rgbToHex(
    clampByte(Number(r)),
    clampByte(Number(g)),
    clampByte(Number(b)),
  );
  return a === undefined ? hex : withAlpha(hex, clampAlphaValue(Number(a)));
}

/** `hsb(h, s, b)`, or `hsba(h, s, b, a)` when `hex` carries an 8-digit
 *  alpha suffix — `hsb()`/`hsba()` aren't real CSS notations (CSS has no
 *  native HSB), so there's no standard precedent to match beyond this
 *  library's own convention: hue 0-360, saturation/brightness as 0-100
 *  integers (not the internal `DynamoHsv`'s 0-1 fractions). */
export function hsbStringOf(hex: string): string {
  const { h, s, v } = hsvOf(hex);
  const alpha = alphaFromHexColor(hex);
  const hRound = Math.round(h);
  const sPercent = clampPercent(s * 100);
  const bPercent = clampPercent(v * 100);
  if (alpha === 1) return `hsb(${hRound}, ${sPercent}, ${bPercent})`;
  return `hsba(${hRound}, ${sPercent}, ${bPercent}, ${alpha})`;
}

/** The reverse of `hsbStringOf` — `null` for anything that doesn't match
 *  `hsb(...)`/`hsba(...)`. */
export function hexFromHsbString(value: string): string | null {
  const match = HSB_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, h, s, b, a] = match;
  const hex = hexFromHsv(
    Number(h),
    clampPercent(Number(s)) / 100,
    clampPercent(Number(b)) / 100,
  );
  return a === undefined ? hex : withAlpha(hex, clampAlphaValue(Number(a)));
}

/** Decodes `value` (shaped per `format`) to a hex string (6-digit, or
 *  8-digit if an alpha channel was present) — the single internal
 *  representation every piece of color math in `DynamoColorPicker` reads.
 *  `''` decodes to `''` under every format (preserves the existing "unset"
 *  sentinel). Unparseable input falls back to `#000000`, mirroring
 *  `rgbHexOf`'s own existing fallback convention — matches `format: 'hex'`
 *  already doing the same via `rgbHexOf`/`hsvOf`'s own internal fallbacks. */
export function decodeToHex(
  value: string,
  format: DynamoColorPickerFormat,
): string {
  if (value === '') return '';
  if (format === 'hex') return value;
  const decoded =
    format === 'rgb' ? hexFromRgbString(value) : hexFromHsbString(value);
  return decoded ?? '#000000';
}

/** Encodes a hex string (6-digit, or 8-digit with an alpha suffix) back
 *  into `format`'s own shape — the inverse of `decodeToHex`, called once
 *  at every write site right before `value.set()`/`onChangeFn()`. Identity
 *  when `format` is `'hex'` (the default), so every existing consumer sees
 *  zero behavior change. */
export function encodeFromHex(
  hex: string,
  format: DynamoColorPickerFormat,
): string {
  if (format === 'hex') return hex;
  return format === 'rgb' ? rgbStringOf(hex) : hsbStringOf(hex);
}
