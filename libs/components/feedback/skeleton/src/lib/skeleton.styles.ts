import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — skeleton.html only ever binds `[class]="classes()"`. No
// existing shimmer/pulse precedent anywhere else in this repo (Spinner's
// `animate-spin` is unrelated) — `animate-pulse` is introduced fresh here,
// paired with `motion-reduce:animate-none` matching Progress's
// `motion-reduce:transition-none` precedent for respecting reduced motion.
export const skeletonStyles = cva('bg-surface-200', {
  variants: {
    variant: {
      text: 'h-4 w-full rounded-sm',
      circular: 'h-10 w-10 rounded-full',
      rectangular: 'h-24 w-full rounded-md',
    },
    // Opt out of the pulse for a static/non-animated placeholder — separate
    // from (and in addition to) the automatic `motion-reduce:animate-none`
    // below, which only fires on the OS-level reduced-motion preference.
    animation: {
      pulse: 'animate-pulse motion-reduce:animate-none',
      // A moving highlight sweeping across a gradient background — see
      // skeleton-wave in preset.css for the underlying @keyframes. The
      // gradient's lighter middle stop (via-surface-100) sits on top of the
      // base bg-surface-200 color class above (different CSS properties, so
      // they compose without conflict).
      wave: 'animate-skeleton-wave bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 bg-[length:200%_100%] motion-reduce:animate-none',
      none: '',
    },
  },
  defaultVariants: { variant: 'text', animation: 'pulse' },
});

/**
 * Arbitrary width/height can't be expressed as discrete cva variants — the
 * same kind of exception as Progress's fill-width and Tree's indent-depth.
 * `[style.width]`/`[style.height]` bind this directly in skeleton.html
 * instead of a class, only when explicitly provided (otherwise the
 * variant's own default size class above applies undisturbed).
 */
export function toCssSize(value: string | number | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  return typeof value === 'number' ? `${value}px` : value;
}
