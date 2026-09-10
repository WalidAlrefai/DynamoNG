import type { ConnectedPosition } from '@angular/cdk/overlay';
import type { DynamoMegaMenuOrientation } from './mega-menu.types';

// Small per-component position map — same precedent as Menubar's own
// `menubar.positioning.ts` (a fixed internal behaviour, not user-tunable).
// A horizontal bar drops its panel straight down (flipping up on collision);
// a vertical bar opens its panel to the right (flipping left on collision).
const HORIZONTAL: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

const VERTICAL: ConnectedPosition[] = [
  { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 4 },
  { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top', offsetX: -4 },
];

export function buildMegaPanelPositions(
  orientation: DynamoMegaMenuOrientation,
): ConnectedPosition[] {
  return orientation === 'vertical' ? VERTICAL : HORIZONTAL;
}
