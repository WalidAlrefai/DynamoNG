import { describe, expect, it } from 'vitest';
import { computeActionOffset } from './speed-dial.geometry';

describe('computeActionOffset', () => {
  describe('linear', () => {
    it('walks up/down/left/right from the trigger, spaced by gap', () => {
      expect(computeActionOffset(0, 3, 'linear', 'up', 90, 56)).toEqual({
        x: 0,
        y: -56,
      });
      expect(computeActionOffset(2, 3, 'linear', 'up', 90, 56)).toEqual({
        x: 0,
        y: -168,
      });
      expect(computeActionOffset(0, 3, 'linear', 'down', 90, 56)).toEqual({
        x: 0,
        y: 56,
      });
      expect(computeActionOffset(1, 3, 'linear', 'left', 90, 56)).toEqual({
        x: -112,
        y: 0,
      });
      expect(computeActionOffset(1, 3, 'linear', 'right', 90, 40)).toEqual({
        x: 80,
        y: 0,
      });
    });
  });

  describe('circle', () => {
    it('spreads actions evenly over 360°, starting at the direction angle', () => {
      // direction "right" → 0°. 4 actions → 0°, 90°, 180°, 270°.
      expect(computeActionOffset(0, 4, 'circle', 'right', 100, 56)).toEqual({
        x: 100,
        y: 0,
      });
      expect(computeActionOffset(1, 4, 'circle', 'right', 100, 56)).toEqual({
        x: 0,
        y: 100,
      });
      expect(computeActionOffset(2, 4, 'circle', 'right', 100, 56)).toEqual({
        x: -100,
        y: 0,
      });
      expect(computeActionOffset(3, 4, 'circle', 'right', 100, 56)).toEqual({
        x: 0,
        y: -100,
      });
    });
  });

  describe('semi-circle', () => {
    it('centres a 180° span on the direction angle', () => {
      // direction "up" → 270°, span 180 → start 180°, end 360°.
      // 3 actions → 180°, 270°, 360°.
      expect(computeActionOffset(0, 3, 'semi-circle', 'up', 100, 56)).toEqual({
        x: -100,
        y: 0,
      });
      expect(computeActionOffset(1, 3, 'semi-circle', 'up', 100, 56)).toEqual({
        x: 0,
        y: -100,
      });
      expect(computeActionOffset(2, 3, 'semi-circle', 'up', 100, 56)).toEqual({
        x: 100,
        y: 0,
      });
    });

    it('places a lone action straight along the direction', () => {
      expect(computeActionOffset(0, 1, 'semi-circle', 'up', 100, 56)).toEqual({
        x: 0,
        y: -100,
      });
    });
  });

  describe('quarter-circle', () => {
    it('centres a 90° span on the direction angle', () => {
      // direction "right" → 0°, span 90 → start -45°, end 45°.
      const first = computeActionOffset(0, 3, 'quarter-circle', 'right', 100, 56);
      const mid = computeActionOffset(1, 3, 'quarter-circle', 'right', 100, 56);
      const last = computeActionOffset(2, 3, 'quarter-circle', 'right', 100, 56);

      expect(first).toEqual({ x: 71, y: -71 });
      expect(mid).toEqual({ x: 100, y: 0 });
      expect(last).toEqual({ x: 71, y: 71 });
    });
  });
});
