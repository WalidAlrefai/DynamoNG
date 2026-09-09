import type { ConnectedPosition } from '@angular/cdk/overlay';

type FlyoutCorner = 'right-start' | 'right-end' | 'left-start' | 'left-end';

// Independently duplicated from Tiered Menu's own tiered-menu.positioning.ts
// (identical shape, which itself was duplicated from Cascade Select's) — this
// codebase's established precedent for small, per-component position maps
// rather than a shared "side flyout" helper.
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
 * Row-anchored submenu flyout positions for dropdown levels 1..N (nested
 * submenus within an open top-level dropdown): prefers opening to the right
 * of the hovered/active row, flips to the left when there's no viewport room
 * (CDK's own collision fallback). Not user-configurable — a fixed internal
 * behavior, same as Tiered Menu's own `buildFlyoutPositions()`. Level 0 (the
 * dropdown directly under a top-level bar item) uses its own bottom/top
 * corner map instead, kept inline in menubar.ts (mirroring Tiered Menu's own
 * inline root-position map).
 */
export function buildFlyoutPositions(): ConnectedPosition[] {
  return ALL_POSITIONS.map((position) => POSITION_MAP[position]);
}
