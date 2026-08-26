import { describe, expect, it } from 'vitest';
import { buildConnectedCornerPositions } from './connected-corner-positions';

describe('buildConnectedCornerPositions', () => {
  it('returns the preferred corner first', () => {
    const positions = buildConnectedCornerPositions('top-end');

    expect(positions[0]).toEqual({
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4,
    });
  });

  it('returns all four corners exactly once, regardless of which is preferred', () => {
    for (const preferred of [
      'bottom-start',
      'bottom-end',
      'top-start',
      'top-end',
    ] as const) {
      const positions = buildConnectedCornerPositions(preferred);

      expect(positions).toHaveLength(4);
      const originYs = positions.map((p) => `${p.originX}-${p.originY}`);
      expect(new Set(originYs).size).toBe(4);
    }
  });

  it('places the fallback corners after the preferred one, in a stable order', () => {
    const positions = buildConnectedCornerPositions('bottom-start');

    expect(positions.map((p) => p.overlayY)).toEqual([
      'top',
      'top',
      'bottom',
      'bottom',
    ]);
  });
});
