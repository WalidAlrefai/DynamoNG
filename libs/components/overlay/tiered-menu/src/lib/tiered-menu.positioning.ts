import type { ConnectedPosition } from '@angular/cdk/overlay';

type FlyoutCorner = 'right-start' | 'right-end' | 'left-start' | 'left-end';

// Independently duplicated from Cascade Select's own cascade-select.positioning.ts
// (identical shape) — this codebase's established precedent for small,
// per-component position maps rather than a shared "side flyout" helper
// (Menu/Popover/SplitButton each keep their own bottom/top-corner copy the
// same way).
const POSITION_MAP: Record<FlyoutCorner, ConnectedPosition> = {
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

const ALL_POSITIONS: FlyoutCorner[] = ['right-start', 'right-end', 'left-start', 'left-end'];

/**
 * Row-anchored submenu flyout positions: prefers opening to the right of the
 * hovered/active item, flips to the left when there's no viewport room (CDK's
 * own collision fallback). Not user-configurable — a fixed internal behavior,
 * same as Cascade Select's own `buildCascadePositions()`.
 */
export function buildFlyoutPositions(): ConnectedPosition[] {
  return ALL_POSITIONS.map((position) => POSITION_MAP[position]);
}
