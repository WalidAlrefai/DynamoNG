import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for these two
// components — timeline.html/timeline-item.html only ever bind
// `[class]="...Classes()"` (or the static `host` class below).
export const timelineRootStyles = 'flex flex-col';

// Structural, not decorative — stays applied even when `unstyled` (same
// precedent as Radio's circle/Checkbox's box staying styled): `group` is
// what makes the connector's `group-last:hidden` trick work at all, not
// just part of the look. Set via `DynamoTimelineItem`'s `host` metadata,
// since a template can only style descendants of its own root, never its
// own host element.
export const timelineItemHostStyles = 'group flex gap-4';

export const timelineMarkerColumnStyles = 'flex flex-col items-center';

export const timelineDotStyles = cva(
  'mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-surface-0',
  {
    variants: {
      severity: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-success',
        info: 'bg-info',
        warning: 'bg-warning',
        danger: 'bg-danger',
      },
    },
    defaultVariants: { severity: 'primary' },
  },
);

// `group-last:hidden` is the entire "is this the last item" mechanism — no
// JS involved. `<dg-timeline-item>` is the actual DOM node sitting among its
// siblings, so Tailwind's `:last-child`-backed `group-last:` variant
// correctly detects the last entry with zero component code.
export const timelineConnectorStyles = 'mt-1 w-px flex-1 bg-border group-last:hidden';

export const timelineContentStyles = 'flex-1 pb-6';
