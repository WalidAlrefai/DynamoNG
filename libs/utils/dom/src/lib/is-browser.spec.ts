import { describe, expect, it } from 'vitest';
import { isBrowser } from './is-browser';

describe('isBrowser', () => {
  it('returns true when `document` is defined (jsdom test environment)', () => {
    expect(isBrowser()).toBe(true);
  });
});
