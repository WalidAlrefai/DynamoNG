import { describe, expect, it } from 'vitest';
import { hexToRgb } from './color-picker.color';
import {
  decodeToHex,
  encodeFromHex,
  hexFromHsbString,
  hexFromRgbString,
  hsbStringOf,
  rgbStringOf,
} from './color-picker.format';

describe('rgbStringOf', () => {
  it('formats an opaque hex as rgb(...)', () => {
    expect(rgbStringOf('#ff0000')).toBe('rgb(255, 0, 0)');
  });

  it('formats an 8-digit hex with alpha as rgba(...)', () => {
    expect(rgbStringOf('#ff000080')).toBe(
      'rgba(255, 0, 0, 0.5019607843137255)',
    );
  });

  it('falls back to rgb(0, 0, 0) for an invalid hex', () => {
    expect(rgbStringOf('not-a-color')).toBe('rgb(0, 0, 0)');
  });
});

describe('hexFromRgbString', () => {
  it('parses rgb(...) back to a 6-digit hex', () => {
    expect(hexFromRgbString('rgb(255, 0, 0)')).toBe('#ff0000');
  });

  it('parses rgba(...) back to an 8-digit hex', () => {
    expect(hexFromRgbString('rgba(255, 0, 0, 0.5)')?.toLowerCase()).toBe(
      '#ff000080',
    );
  });

  it('tolerates extra whitespace', () => {
    expect(hexFromRgbString('rgb( 0 , 128 , 0 )')).toBe('#008000');
  });

  it('returns null for malformed input', () => {
    expect(hexFromRgbString('not-a-color')).toBeNull();
    expect(hexFromRgbString('hsb(0, 100, 100)')).toBeNull();
  });
});

describe('hsbStringOf', () => {
  it('formats an opaque hex as hsb(...)', () => {
    expect(hsbStringOf('#ff0000')).toBe('hsb(0, 100, 100)');
  });

  it('formats an 8-digit hex with alpha as hsba(...)', () => {
    expect(hsbStringOf('#ff000080')).toBe(
      'hsba(0, 100, 100, 0.5019607843137255)',
    );
  });

  it('falls back to hsb(0, 0, 0) for an invalid hex', () => {
    expect(hsbStringOf('not-a-color')).toBe('hsb(0, 0, 0)');
  });
});

describe('hexFromHsbString', () => {
  it('parses hsb(...) back to a 6-digit hex', () => {
    expect(hexFromHsbString('hsb(0, 100, 100)')).toBe('#ff0000');
  });

  it('parses hsba(...) back to an 8-digit hex', () => {
    expect(hexFromHsbString('hsba(0, 100, 100, 0.5)')?.toLowerCase()).toBe(
      '#ff000080',
    );
  });

  it('returns null for malformed input', () => {
    expect(hexFromHsbString('not-a-color')).toBeNull();
    expect(hexFromHsbString('rgb(255, 0, 0)')).toBeNull();
  });
});

describe('decodeToHex', () => {
  it('is the identity for format "hex"', () => {
    expect(decodeToHex('#ff0000', 'hex')).toBe('#ff0000');
    expect(decodeToHex('not-a-color', 'hex')).toBe('not-a-color');
  });

  it('decodes a valid rgb()/hsb() string under the matching format', () => {
    expect(decodeToHex('rgb(255, 0, 0)', 'rgb')).toBe('#ff0000');
    expect(decodeToHex('hsb(0, 100, 100)', 'hsb')).toBe('#ff0000');
  });

  it('preserves the empty-string unset sentinel under every format', () => {
    expect(decodeToHex('', 'hex')).toBe('');
    expect(decodeToHex('', 'rgb')).toBe('');
    expect(decodeToHex('', 'hsb')).toBe('');
  });

  it('falls back to #000000 for malformed rgb()/hsb() input', () => {
    expect(decodeToHex('not-a-color', 'rgb')).toBe('#000000');
    expect(decodeToHex('not-a-color', 'hsb')).toBe('#000000');
  });
});

describe('encodeFromHex', () => {
  it('is the identity for format "hex"', () => {
    expect(encodeFromHex('#ff0000', 'hex')).toBe('#ff0000');
  });

  it('encodes hex into rgb()/hsb() under the matching format', () => {
    expect(encodeFromHex('#ff0000', 'rgb')).toBe('rgb(255, 0, 0)');
    expect(encodeFromHex('#ff0000', 'hsb')).toBe('hsb(0, 100, 100)');
  });

  it('round-trips exactly through hex and rgb (both integer-precise)', () => {
    for (const format of ['hex', 'rgb'] as const) {
      const encoded = encodeFromHex('#3b82f6', format);
      expect(decodeToHex(encoded, format)).toBe('#3b82f6');
    }
  });

  it('round-trips through hsb within ±1 per channel (0-100 integer percent is inherently lossy)', () => {
    const encoded = encodeFromHex('#3b82f6', 'hsb');
    const roundTripped = decodeToHex(encoded, 'hsb');
    const original = hexToRgb('#3b82f6');
    const after = hexToRgb(roundTripped);
    expect(Math.abs(original.r - after.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(original.g - after.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(original.b - after.b)).toBeLessThanOrEqual(1);
  });

  it('composes alpha into rgba()/hsba() for an 8-digit hex', () => {
    expect(encodeFromHex('#ff000080', 'rgb')).toContain('rgba(');
    expect(encodeFromHex('#ff000080', 'hsb')).toContain('hsba(');
  });
});
