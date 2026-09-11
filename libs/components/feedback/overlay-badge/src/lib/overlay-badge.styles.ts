import { cva } from 'class-variance-authority';
import type { DynamoOverlayBadgePosition } from './overlay-badge.types';

// The only place Tailwind utility classes are allowed to live for this
// component — overlay-badge.html binds `[class]="...Classes()"` /
// `[styleClass]`.

export const overlayBadgeRootStyles = 'relative inline-flex';

// Positions the overlaid marker half-outside the wrapped element's corner.
// `end-0`/`start-0` follow the writing direction; Tailwind has no logical
// `translate`, so the horizontal push-out is mirrored explicitly under `rtl:`.
const CORNER: Record<DynamoOverlayBadgePosition, string> = {
  'top-right':
    'top-0 end-0 -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2',
  'top-left':
    'top-0 start-0 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2',
  'bottom-right':
    'bottom-0 end-0 translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2',
  'bottom-left':
    'bottom-0 start-0 translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2',
};

// Passed to `<dg-badge [styleClass]>` — shrinks it to an overlay size and
// pins it to the chosen corner. `cn()`/tailwind-merge inside DynamoBadge
// resolves this against its own `px-*`/`text-*`.
export const overlayBadgeBadgeStyles = cva(
  'pointer-events-none absolute z-10 min-w-4 justify-center px-1 text-xs',
  {
    variants: {
      position: {
        'top-right': CORNER['top-right'],
        'top-left': CORNER['top-left'],
        'bottom-right': CORNER['bottom-right'],
        'bottom-left': CORNER['bottom-left'],
      },
    },
    defaultVariants: { position: 'top-right' },
  },
);

// The bare-dot variant (no `value`) — its own element, coloured by severity.
export const overlayBadgeDotStyles = cva(
  'pointer-events-none absolute z-10 h-2.5 w-2.5 rounded-full ring-2 ring-surface-0',
  {
    variants: {
      position: {
        'top-right': CORNER['top-right'],
        'top-left': CORNER['top-left'],
        'bottom-right': CORNER['bottom-right'],
        'bottom-left': CORNER['bottom-left'],
      },
      severity: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-success',
        info: 'bg-info',
        warning: 'bg-warning',
        danger: 'bg-danger',
      },
    },
    defaultVariants: { position: 'top-right', severity: 'danger' },
  },
);
