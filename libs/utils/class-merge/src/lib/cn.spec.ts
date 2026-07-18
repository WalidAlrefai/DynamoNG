import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins plain string class names', () => {
    expect(cn('inline-flex', 'items-center')).toBe('inline-flex items-center');
  });

  it('drops falsy values', () => {
    const isActive = false;
    expect(cn('a', isActive && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('applies conditional object syntax like clsx', () => {
    expect(cn({ 'is-active': true, 'is-disabled': false })).toBe('is-active');
  });

  it('resolves conflicting Tailwind utilities in favor of the later class', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('lets a later explicit override win over an earlier variant class', () => {
    expect(cn('bg-primary text-on-primary', 'bg-danger')).toBe('text-on-primary bg-danger');
  });

  it('merges an array of class values', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });
});
