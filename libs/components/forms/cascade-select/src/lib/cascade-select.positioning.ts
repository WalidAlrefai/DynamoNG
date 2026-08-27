import type { ConnectedPosition } from '@angular/cdk/overlay';
import type { DynamoCascadePosition } from './cascade-select.types';

const POSITION_MAP: Record<DynamoCascadePosition, ConnectedPosition> = {
  'right-start': {
    originX: 'end',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'top',
    offsetX: 4,
  },
  'right-end': {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetX: 4,
  },
  'left-start': {
    originX: 'start',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'top',
    offsetX: -4,
  },
  'left-end': {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetX: -4,
  },
};

const ALL_POSITIONS: DynamoCascadePosition[] = [
  'right-start',
  'right-end',
  'left-start',
  'left-end',
];

/**
 * Row-anchored flyout positions: prefers opening to the right of the hovered
 * row, flips to the left when there's no viewport room (CDK's own collision
 * fallback, same push/flip config as `buildListboxPositions`). Only one
 * caller/one preferred corner exists in this component, unlike
 * `buildListboxPositions` — no `preferred` parameter needed.
 */
export function buildCascadePositions(): ConnectedPosition[] {
  return ALL_POSITIONS.map((position) => POSITION_MAP[position]);
}
