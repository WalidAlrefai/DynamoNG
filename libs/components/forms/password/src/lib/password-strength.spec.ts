import { describe, expect, it } from 'vitest';
import { calculatePasswordStrength } from './password-strength';

describe('calculatePasswordStrength', () => {
  it('returns weak/0%/danger for an empty value', () => {
    expect(calculatePasswordStrength('')).toEqual({
      score: 0,
      percent: 0,
      label: 'weak',
      severity: 'danger',
    });
  });

  it.each([
    ['abc', 0, 'weak', 'danger'],
    ['abcdefgh', 1, 'weak', 'danger'],
    ['abcdefgh1', 2, 'medium', 'warning'],
    ['Abcdefgh12', 3, 'strong', 'success'],
    ['Abcdefghij12!@', 4, 'strong', 'success'],
  ] as const)('maps %s to score %i (%s/%s)', (value, score, label, severity) => {
    const result = calculatePasswordStrength(value);
    expect(result.score).toBe(score);
    expect(result.label).toBe(label);
    expect(result.severity).toBe(severity);
    expect(result.percent).toBe((score / 4) * 100);
  });

  describe('length boundaries', () => {
    it('does not award the >=8 point at length 7', () => {
      expect(calculatePasswordStrength('abcdefg').score).toBe(0);
    });

    it('awards the >=8 point at length 8', () => {
      expect(calculatePasswordStrength('abcdefgh').score).toBe(1);
    });

    it('does not award the >=12 point at length 11', () => {
      expect(calculatePasswordStrength('abcdefghijk').score).toBe(1);
    });

    it('awards the >=12 point at length 12', () => {
      expect(calculatePasswordStrength('abcdefghijkl').score).toBe(2);
    });
  });

  it('floors the classes contribution at 0 for a single-class password (length alone cannot exceed medium)', () => {
    // 20 lowercase-only chars: both length points (+2), but a single
    // character class contributes 0, so this can never reach "strong".
    const result = calculatePasswordStrength('abcdefghijklmnopqrst');
    expect(result.score).toBe(2);
    expect(result.label).toBe('medium');
  });

  it('caps the classes contribution at 2 even with all four classes present', () => {
    // classes - 1 = 3, capped to 2, so score maxes at 4 (2 length + 2 classes).
    const result = calculatePasswordStrength('Ab1!Ab1!Ab1!');
    expect(result.score).toBe(4);
    expect(result.label).toBe('strong');
  });
});
