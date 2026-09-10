import type {
  DynamoSpeedDialDirection,
  DynamoSpeedDialType,
} from './speed-dial.types';

export interface SpeedDialOffset {
  x: number;
  y: number;
}

// Screen-space angle convention: 0° points right, 90° points down (matching
// CSS's y-axis), 180° left, 270° up.
const DIRECTION_ANGLE: Record<DynamoSpeedDialDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

const ARC_SPAN: Record<Exclude<DynamoSpeedDialType, 'linear'>, number> = {
  circle: 360,
  'semi-circle': 180,
  'quarter-circle': 90,
};

/**
 * Pure geometry for placing action `index` of `total` around the trigger.
 * `linear` walks a straight line along `direction` spaced by `gap`px; the arc
 * types distribute the actions over their span (`circle` fills 360° starting
 * at the `direction` angle; `semi-circle`/`quarter-circle` centre their span
 * on the `direction` angle). Returns an integer px `{x, y}` translate.
 */
export function computeActionOffset(
  index: number,
  total: number,
  type: DynamoSpeedDialType,
  direction: DynamoSpeedDialDirection,
  radius: number,
  gap: number,
): SpeedDialOffset {
  if (type === 'linear') {
    const distance = gap * (index + 1);
    switch (direction) {
      case 'up':
        return { x: 0, y: -distance };
      case 'down':
        return { x: 0, y: distance };
      case 'left':
        return { x: -distance, y: 0 };
      case 'right':
        return { x: distance, y: 0 };
    }
  }

  const center = DIRECTION_ANGLE[direction];
  const span = ARC_SPAN[type];

  let angleDeg: number;
  if (type === 'circle') {
    angleDeg = center + (span / Math.max(total, 1)) * index;
  } else if (total === 1) {
    angleDeg = center;
  } else {
    const start = center - span / 2;
    angleDeg = start + (span / (total - 1)) * index;
  }

  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: normalizeZero(Math.round(radius * Math.cos(rad))),
    y: normalizeZero(Math.round(radius * Math.sin(rad))),
  };
}

// `Math.round(-0.2)` is `-0`, which `-0 !== 0` deep-equality checks flag.
function normalizeZero(n: number): number {
  return n === 0 ? 0 : n;
}
