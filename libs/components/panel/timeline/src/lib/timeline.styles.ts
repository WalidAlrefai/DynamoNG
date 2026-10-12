import { cva } from 'class-variance-authority';
import type { DynamoTimelineOrientation } from './timeline.types';

// The only place Tailwind utility classes are allowed to live for these two
// components — timeline.html/timeline-item.html only ever bind
// `[class]="...Classes()"` (or the static `host` class below).
export const timelineRootStyles = cva('flex', {
  variants: {
    orientation: {
      vertical: 'flex-col',
      horizontal: 'flex-row',
    },
    fluid: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: { orientation: 'vertical', fluid: false },
});

// Structural, not decorative — stays applied even when `unstyled` (same
// precedent as Radio's circle/Checkbox's box staying styled): `group` is
// what makes the connector's `group-last:hidden` trick work at all, not
// just part of the look. Set via `DynamoTimelineItem`'s `host` metadata,
// since a template can only style descendants of its own root, never its
// own host element.
//
// Every class below is a mechanical 90° rotation between orientations:
// flex row <-> flex column, `w-px`/`mt-1` vertical line <-> `h-px`/`ms-1`
// horizontal line, `pb-6` spacing-below <-> `pe-6` spacing-after (the
// logical-property form, so it still flips correctly under RTL — same
// convention as Select-Button's own `-ms-px`).
export function timelineItemHostStyles(
  orientation: DynamoTimelineOrientation,
  reversed: boolean,
): string {
  if (orientation === 'horizontal') {
    return reversed
      ? 'group flex flex-col-reverse gap-4'
      : 'group flex flex-col gap-4';
  }
  return reversed ? 'group flex flex-row-reverse gap-4' : 'group flex gap-4';
}

// Grid's default align-items is also stretch (same as flex's), so the
// marker column's connector still stretches to the full cross-axis size
// with no explicit override — same mechanism as the flex layout above.
export function timelineItemHostAlternateStyles(
  orientation: DynamoTimelineOrientation,
): string {
  return orientation === 'horizontal'
    ? 'group grid grid-rows-[1fr_auto_1fr] gap-4'
    : 'group grid grid-cols-[1fr_auto_1fr] gap-4';
}

export function timelineMarkerColumnStyles(
  orientation: DynamoTimelineOrientation,
): string {
  return orientation === 'horizontal'
    ? 'flex flex-row items-center'
    : 'flex flex-col items-center';
}

export const timelineDotStyles = cva(
  'h-3 w-3 shrink-0 rounded-full ring-4 ring-surface-0',
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
      // The top-margin nudge aligns the dot with adjacent text content in
      // a vertical layout only — content sits below/above (not beside) the
      // marker in horizontal orientation, so there's nothing to align the
      // dot's own cross-axis offset against there.
      orientation: {
        vertical: 'mt-1.5',
        horizontal: '',
      },
    },
    defaultVariants: { severity: 'primary', orientation: 'vertical' },
  },
);

// `group-last:hidden` is the entire "is this the last item" mechanism — no
// JS involved. `<dg-timeline-item>` is the actual DOM node sitting among its
// siblings, so Tailwind's `:last-child`-backed `group-last:` variant
// correctly detects the last entry with zero component code — true
// regardless of orientation.
export function timelineConnectorStyles(
  orientation: DynamoTimelineOrientation,
): string {
  return orientation === 'horizontal'
    ? 'ms-1 h-px flex-1 bg-border group-last:hidden'
    : 'mt-1 w-px flex-1 bg-border group-last:hidden';
}

export function timelineContentStyles(
  orientation: DynamoTimelineOrientation,
): string {
  return orientation === 'horizontal' ? 'flex-1 pe-6' : 'flex-1 pb-6';
}
