import { describe, expect, it } from 'vitest';
import { getCachedDateTimeFormat } from './date-format-cache';

describe('getCachedDateTimeFormat', () => {
  it('returns the same formatter instance for an identical locale/options pair', () => {
    const first = getCachedDateTimeFormat('en', { dateStyle: 'medium' });
    const second = getCachedDateTimeFormat('en', { dateStyle: 'medium' });
    expect(second).toBe(first);
  });

  it('returns different instances for different options', () => {
    const medium = getCachedDateTimeFormat('en', { dateStyle: 'medium' });
    const monthYear = getCachedDateTimeFormat('en', {
      month: 'long',
      year: 'numeric',
    });
    expect(monthYear).not.toBe(medium);
  });

  it('returns different instances for different locales', () => {
    const en = getCachedDateTimeFormat('en', { dateStyle: 'medium' });
    const fr = getCachedDateTimeFormat('fr', { dateStyle: 'medium' });
    expect(fr).not.toBe(en);
  });

  it('formats correctly regardless of caching', () => {
    const formatter = getCachedDateTimeFormat('en', {
      month: 'long',
      year: 'numeric',
    });
    expect(formatter.format(new Date(2026, 7, 19))).toBe('August 2026');
  });
});
