import { describe, expect, it } from 'vitest';
import {
  applyDateMask,
  formatDate,
  inferFormatFromLocale,
  isFixedWidthFormat,
  parseDateString,
  parseFormatTokens,
} from './date-picker-format';

describe('parseFormatTokens', () => {
  it('tokenizes a simple mm/dd/yy format', () => {
    expect(parseFormatTokens('mm/dd/yy')).toEqual([
      { type: 'token', token: 'mm' },
      { type: 'literal', text: '/' },
      { type: 'token', token: 'dd' },
      { type: 'literal', text: '/' },
      { type: 'token', token: 'yy' },
    ]);
  });

  it('tokenizes yyyy before yy is greedily matched', () => {
    expect(parseFormatTokens('yyyy-mm-dd')).toEqual([
      { type: 'token', token: 'yyyy' },
      { type: 'literal', text: '-' },
      { type: 'token', token: 'mm' },
      { type: 'literal', text: '-' },
      { type: 'token', token: 'dd' },
    ]);
  });

  it('handles flexible single-width tokens', () => {
    expect(parseFormatTokens('d/m/yy')).toEqual([
      { type: 'token', token: 'd' },
      { type: 'literal', text: '/' },
      { type: 'token', token: 'm' },
      { type: 'literal', text: '/' },
      { type: 'token', token: 'yy' },
    ]);
  });
});

describe('isFixedWidthFormat', () => {
  it('is true for dd/mm/yyyy', () => {
    expect(isFixedWidthFormat(parseFormatTokens('dd/mm/yyyy'))).toBe(true);
  });

  it('is false when d or m (flexible) appear', () => {
    expect(isFixedWidthFormat(parseFormatTokens('d/m/yy'))).toBe(false);
  });
});

describe('formatDate / parseDateString round-trip', () => {
  const parts = parseFormatTokens('mm/dd/yyyy');

  it('formats a date using the given tokens', () => {
    expect(formatDate(new Date(2026, 7, 9), parts)).toBe('08/09/2026');
  });

  it('parses formatted text back into the same date', () => {
    expect(parseDateString('08/09/2026', parts)).toEqual(new Date(2026, 7, 9));
  });

  it('round-trips for every day of a 31-day month', () => {
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2026, 0, day);
      expect(parseDateString(formatDate(date, parts), parts)).toEqual(date);
    }
  });

  it('rejects text with the wrong separators', () => {
    expect(parseDateString('08-09-2026', parts)).toBeNull();
  });

  it('rejects an incomplete string', () => {
    expect(parseDateString('08/09/', parts)).toBeNull();
  });

  it('rejects trailing garbage', () => {
    expect(parseDateString('08/09/2026x', parts)).toBeNull();
  });

  it('rejects a calendar-invalid date (Feb 31)', () => {
    expect(parseDateString('02/31/2026', parts)).toBeNull();
  });

  it('rejects month 13', () => {
    expect(parseDateString('13/01/2026', parts)).toBeNull();
  });
});

describe('parseDateString — 2-digit year pivot', () => {
  const parts = parseFormatTokens('mm/dd/yy');

  it('resolves 00-68 to the 2000s', () => {
    expect(parseDateString('01/01/00', parts)?.getFullYear()).toBe(2000);
    expect(parseDateString('01/01/68', parts)?.getFullYear()).toBe(2068);
  });

  it('resolves 69-99 to the 1900s', () => {
    expect(parseDateString('01/01/69', parts)?.getFullYear()).toBe(1969);
    expect(parseDateString('01/01/99', parts)?.getFullYear()).toBe(1999);
  });
});

describe('inferFormatFromLocale', () => {
  it('puts month before day for en-US', () => {
    const parts = inferFormatFromLocale('en-US').filter(
      (p) => p.type === 'token',
    );
    const monthIndex = parts.findIndex(
      (p) => p.type === 'token' && p.token === 'mm',
    );
    const dayIndex = parts.findIndex(
      (p) => p.type === 'token' && p.token === 'dd',
    );
    expect(monthIndex).toBeLessThan(dayIndex);
  });

  it('puts day before month for en-GB', () => {
    const parts = inferFormatFromLocale('en-GB').filter(
      (p) => p.type === 'token',
    );
    const monthIndex = parts.findIndex(
      (p) => p.type === 'token' && p.token === 'mm',
    );
    const dayIndex = parts.findIndex(
      (p) => p.type === 'token' && p.token === 'dd',
    );
    expect(dayIndex).toBeLessThan(monthIndex);
  });

  it('round-trips through formatDate/parseDateString for the inferred format', () => {
    const parts = inferFormatFromLocale('en-US');
    const date = new Date(2026, 7, 19);
    expect(parseDateString(formatDate(date, parts), parts)).toEqual(date);
  });
});

describe('applyDateMask', () => {
  const parts = parseFormatTokens('mm/dd/yyyy');

  it('auto-inserts the trailing literal once a digit group completes', () => {
    // Matches standard mask UX (e.g. PrimeNG's inputMask): the '/' appears
    // as soon as the two-digit month is filled, ready for the next segment.
    expect(applyDateMask('08', parts)).toBe('08/');
    expect(applyDateMask('0809', parts)).toBe('08/09/');
    expect(applyDateMask('08092026', parts)).toBe('08/09/2026');
  });

  it('ignores non-digit characters already present in the raw value', () => {
    expect(applyDateMask('08/09/2026', parts)).toBe('08/09/2026');
  });

  it('truncates once every slot is filled', () => {
    expect(applyDateMask('080920261234', parts)).toBe('08/09/2026');
  });

  it('is a no-op for a flexible-width format (requires an explicit fixed-width dateFormat)', () => {
    const flexible = parseFormatTokens('d/m/yy');
    expect(applyDateMask('0809', flexible)).toBe('0809');
  });
});
