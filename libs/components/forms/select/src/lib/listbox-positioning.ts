import type { ConnectedPosition } from '@angular/cdk/overlay';
import type { DynamoSelectPosition } from './select.types';

const POSITION_MAP: Record<DynamoSelectPosition, ConnectedPosition> = {
  'bottom-start': {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 4,
  },
  'bottom-end': {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 4,
  },
  'top-start': {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -4,
  },
  'top-end': {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -4,
  },
};

const ALL_POSITIONS: DynamoSelectPosition[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
];

/** Preferred corner first, the other three as CDK collision fallbacks. Mirrors `DynamoMenu`'s `buildPositions`. */
export function buildListboxPositions(
  preferred: DynamoSelectPosition,
): ConnectedPosition[] {
  return [
    POSITION_MAP[preferred],
    ...ALL_POSITIONS.filter((candidate) => candidate !== preferred).map(
      (candidate) => POSITION_MAP[candidate],
    ),
  ];
}
