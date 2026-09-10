import { describe, expect, it } from 'vitest';
import {
  controlSizeVariants,
  focusRingClass,
  focusRingInvalidClass,
  focusRingPeerClass,
  focusRingWithinClass,
  overlayPanelClass,
  sectionHeadingClass,
} from '../index';

describe('@dynamong/utils/styles', () => {
  it('exposes the sm/md/lg control-size triad, each with height + padding + text', () => {
    expect(Object.keys(controlSizeVariants)).toEqual(['sm', 'md', 'lg']);
    for (const [size, value] of Object.entries(controlSizeVariants)) {
      expect(value, size).toMatch(/\bh-\d+\b/);
      expect(value, size).toMatch(/\bpx-\d+\b/);
      expect(value, size).toMatch(/\btext-(sm|base|lg)\b/);
    }
  });

  it('maps each focus-ring constant to its preset `@utility` name', () => {
    expect(focusRingClass).toBe('dg-focus-ring');
    expect(focusRingWithinClass).toBe('dg-focus-ring-within');
    expect(focusRingPeerClass).toBe('dg-focus-ring-peer');
    expect(focusRingInvalidClass).toContain('--dg-focus-ring-color');
    expect(focusRingInvalidClass).toContain('--color-danger');
  });

  it('provides the shared section-heading and overlay-panel recipes', () => {
    expect(sectionHeadingClass).toContain('uppercase');
    expect(sectionHeadingClass).toContain('text-text-muted');
    expect(overlayPanelClass).toContain('border-border');
    expect(overlayPanelClass).toContain('bg-surface-0');
    expect(overlayPanelClass).toContain('shadow-lg');
  });
});
