import type { ConnectedPosition } from '@angular/cdk/overlay';

export type DynamoConnectedCorner =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end';

const POSITION_MAP: Record<DynamoConnectedCorner, ConnectedPosition> = {
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

const ALL_CORNERS: DynamoConnectedCorner[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
];

/**
 * Preferred corner first, the other three as CDK collision fallbacks. This
 * exact 4-corner shape was independently copy-pasted by Menu, Popover, and
 * SplitButton before being extracted here — those three keep their own
 * existing copies (retrofitting shipped, tested components is a separate
 * refactor), but any new component should use this shared version instead of
 * adding a fifth copy.
 */
export function buildConnectedCornerPositions(
  preferred: DynamoConnectedCorner,
): ConnectedPosition[] {
  return [
    POSITION_MAP[preferred],
    ...ALL_CORNERS.filter((corner) => corner !== preferred).map(
      (corner) => POSITION_MAP[corner],
    ),
  ];
}
