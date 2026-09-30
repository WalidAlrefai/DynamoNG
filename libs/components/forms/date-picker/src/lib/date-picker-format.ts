/**
 * Pure date format/parse/mask helpers for DynamoDatePicker's typable trigger.
 * A deliberately small token subset — not PrimeNG's full format grammar (same
 * proportional scoping call already made for InputText's variant/fluid
 * additions) — but enough for the common `'mm/dd/yy'`-style cases, plus a
 * locale-inferred fallback when no explicit `dateFormat` is given.
 */

export type DatePickerFormatToken = 'd' | 'dd' | 'm' | 'mm' | 'yy' | 'yyyy';

export type FormatPart =
  | { type: 'token'; token: DatePickerFormatToken }
  | { type: 'literal'; text: string };

const TOKEN_PATTERN = /yyyy|yy|dd|mm|d|m/g;

/** Tokenizes a `'mm/dd/yy'`-style format string into token/literal parts. */
export function parseFormatTokens(format: string): FormatPart[] {
  const parts: FormatPart[] = [];
  let lastIndex = 0;
  for (const match of format.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: 'literal', text: format.slice(lastIndex, index) });
    }
    parts.push({ type: 'token', token: match[0] as DatePickerFormatToken });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < format.length) {
    parts.push({ type: 'literal', text: format.slice(lastIndex) });
  }
  return parts;
}

/** Whether every token in `parts` has a fixed width — required for `mask`. */
export function isFixedWidthFormat(parts: FormatPart[]): boolean {
  return parts.every(
    (part) =>
      part.type === 'literal' || (part.token !== 'd' && part.token !== 'm'),
  );
}

function tokenValue(date: Date, token: DatePickerFormatToken): string {
  switch (token) {
    case 'd':
      return String(date.getDate());
    case 'dd':
      return String(date.getDate()).padStart(2, '0');
    case 'm':
      return String(date.getMonth() + 1);
    case 'mm':
      return String(date.getMonth() + 1).padStart(2, '0');
    case 'yy':
      return String(date.getFullYear()).slice(-2);
    case 'yyyy':
      return String(date.getFullYear()).padStart(4, '0');
  }
}

export function formatDate(date: Date, parts: FormatPart[]): string {
  return parts
    .map((part) =>
      part.type === 'literal' ? part.text : tokenValue(date, part.token),
    )
    .join('');
}

/** 2-digit `yy` pivot: 00–68 -> 2000s, 69–99 -> 1900s (matches common libraries' convention). */
function resolveTwoDigitYear(yy: number): number {
  return yy <= 68 ? 2000 + yy : 1900 + yy;
}

/**
 * Parses `text` against `parts`. Returns `null` when the text doesn't match
 * the format's literal separators/token widths, or resolves to a
 * calendar-invalid date (e.g. day 31 in February — validated by round-tripping
 * through `Date` and checking the parts stuck).
 */
export function parseDateString(
  text: string,
  parts: FormatPart[],
): Date | null {
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;
  let cursor = 0;

  for (const part of parts) {
    if (part.type === 'literal') {
      if (text.slice(cursor, cursor + part.text.length) !== part.text)
        return null;
      cursor += part.text.length;
      continue;
    }
    const maxWidth = part.token === 'yyyy' ? 4 : 2;
    const digitMatch = /^\d+/.exec(text.slice(cursor, cursor + maxWidth));
    if (!digitMatch) return null;
    const raw = digitMatch[0];
    cursor += raw.length;
    const value = Number(raw);
    switch (part.token) {
      case 'd':
      case 'dd':
        day = value;
        break;
      case 'm':
      case 'mm':
        month = value;
        break;
      case 'yy':
        year = resolveTwoDigitYear(value);
        break;
      case 'yyyy':
        year = value;
        break;
    }
  }
  if (cursor !== text.length) return null;
  if (day === undefined || month === undefined || year === undefined)
    return null;
  if (month < 1 || month > 12 || day < 1) return null;

  const result = new Date(year, month - 1, day);
  // Date rolls an out-of-range day/month forward (e.g. Feb 31 -> Mar 3) —
  // reject anything that didn't round-trip back to the requested fields.
  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day
  ) {
    return null;
  }
  return result;
}

/**
 * Infers format tokens from `Intl.DateTimeFormat(locale, { dateStyle: 'short' })`'s
 * part order and literal separators — used whenever `dateFormat` is unset, so
 * Format and Locale compose without extra input wiring.
 */
export function inferFormatFromLocale(locale: string): FormatPart[] {
  const reference = new Date(2000, 0, 1);
  const intlParts = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
  }).formatToParts(reference);
  const parts: FormatPart[] = [];
  for (const part of intlParts) {
    switch (part.type) {
      case 'day':
        parts.push({ type: 'token', token: 'dd' });
        break;
      case 'month':
        parts.push({ type: 'token', token: 'mm' });
        break;
      case 'year':
        parts.push({
          type: 'token',
          token: part.value.length >= 4 ? 'yyyy' : 'yy',
        });
        break;
      default:
        parts.push({ type: 'literal', text: part.value });
    }
  }
  return parts;
}

type MaskSlot =
  | { type: 'digit'; token: DatePickerFormatToken }
  | { type: 'literal'; char: string };

function buildMaskSlots(parts: FormatPart[]): MaskSlot[] {
  const slots: MaskSlot[] = [];
  for (const part of parts) {
    if (part.type === 'literal') {
      for (const char of part.text) slots.push({ type: 'literal', char });
      continue;
    }
    const width = part.token === 'yyyy' ? 4 : 2;
    for (let i = 0; i < width; i++)
      slots.push({ type: 'digit', token: part.token });
  }
  return slots;
}

/**
 * Applies a digit-only mask (fixed-width tokens + literal separators) to
 * `raw`, re-deriving the full masked string from scratch on every call — the
 * same "always re-derive, never incrementally diff" idiom
 * `@dynamong/input-mask` uses, adapted here without letter/alphanumeric slots
 * (dates never need them). No-op (returns `raw` unchanged) when `parts`
 * contains a flexible-width token (`d`/`m`) — `mask` requires an explicit
 * fixed-width `dateFormat`.
 */
export function applyDateMask(raw: string, parts: FormatPart[]): string {
  if (!isFixedWidthFormat(parts)) return raw;
  const slots = buildMaskSlots(parts);
  const digits = raw.replace(/\D/g, '');
  let digitIndex = 0;
  let result = '';
  for (const slot of slots) {
    if (slot.type === 'literal') {
      result += slot.char;
      continue;
    }
    if (digitIndex >= digits.length) break;
    result += digits[digitIndex];
    digitIndex++;
  }
  return result;
}
