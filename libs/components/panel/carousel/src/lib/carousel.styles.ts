import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — carousel.html only ever binds `[class]="...Classes()"`, except
// the track's `[style.transform]` and each slide's `[style.flex]` (see
// carousel.ts): a continuous active-index + live-drag-distance offset, and a
// per-instance slide width driven by `numVisible`, neither of which can be
// expressed as discrete cva variants — the same "deliberate inline-style
// exception" pattern used by Progress's fill-width, Tree's indent-depth, and
// Skeleton's width/height.
export const carouselRootStyles = 'relative w-full';

// `touch-pan-y`/`touch-pan-x` lets the browser keep handling scroll on the
// axis the carousel ISN'T dragging on (vertical page scroll while dragging
// a horizontal carousel, and vice versa).
export const carouselViewportStyles = cva(
  'relative overflow-hidden rounded-lg focus-visible:outline-none',
  {
    variants: {
      orientation: {
        horizontal: 'touch-pan-y',
        vertical: 'touch-pan-x',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

// Each slide's own `[style.flex]`-driven basis percentage (see carousel.ts)
// follows whichever direction this is set to for free — no other sizing
// change needed to support the vertical axis.
export const carouselTrackBaseStyles = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});
export const carouselTrackTransitionStyles =
  'transition-transform duration-300 ease-in-out motion-reduce:transition-none';
export const carouselTrackNoTransitionStyles = 'transition-none';
// Prevents a slide's own content from forcing it past its
// `[style.flex]`-driven basis on whichever axis is the main one —
// width/shrink themselves are set inline, per instance, so they can't live
// here as a static class.
export const carouselSlideStyles = cva('', {
  variants: {
    orientation: {
      horizontal: 'min-w-0',
      vertical: 'min-h-0',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});
// A filled, circular scrim rather than dg-button's default rectangular
// "text" shape — these controls float over arbitrary consumer-supplied
// slide content (unlike e.g. Pagination's identical text-variant arrows,
// which only ever sit on a plain page background), so they need an opaque
// background to stay visible regardless of what's behind them. cn()'s
// tailwind-merge resolves the conflicting rounded-md/sizing classes from
// buttonStyles cleanly — no !important needed.
export const carouselPrevArrowStyles = cva(
  'absolute z-10 h-8 w-8 rounded-full p-0 shadow-md',
  {
    variants: {
      orientation: {
        horizontal: 'start-2 top-1/2 -translate-y-1/2',
        vertical: 'top-2 start-1/2 -translate-x-1/2',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);
export const carouselNextArrowStyles = cva(
  'absolute z-10 h-8 w-8 rounded-full p-0 shadow-md',
  {
    variants: {
      orientation: {
        horizontal: 'end-2 top-1/2 -translate-y-1/2',
        vertical: 'bottom-2 start-1/2 -translate-x-1/2',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);
// A left-chevron rotated 90° clockwise reads as an up-chevron; a
// right-chevron the same way reads as down — exactly "previous"/"next"
// stacked vertically. Tailwind v4 implements `rotate-*` as the separate
// `rotate` CSS property (not `transform`), so it's named explicitly here.
export const carouselArrowIconStyles = cva(
  'transition-[rotate] duration-200 motion-reduce:transition-none',
  {
    variants: {
      orientation: {
        horizontal: 'rotate-0',
        vertical: 'rotate-90',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);
export const carouselIndicatorsStyles =
  'flex items-center justify-center gap-2 pt-3';
export const carouselPlayToggleStyles =
  'absolute bottom-2 end-2 z-10 rounded-full shadow-md';

// The two states here are a real visual variant axis (unlike most of the
// plain strings above), same shape as stepperConnectorStyles' `completed`
// boolean variant.
export const carouselDotStyles = cva(
  'h-2 rounded-full transition-all motion-reduce:transition-none',
  {
    variants: {
      active: {
        true: 'w-6 bg-primary',
        false: 'w-2 bg-surface-300',
      },
    },
    defaultVariants: { active: false },
  },
);
