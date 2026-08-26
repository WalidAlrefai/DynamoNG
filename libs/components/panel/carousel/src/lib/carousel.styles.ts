import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — carousel.html only ever binds `[class]="...Classes()"`, except
// the track's `[style.transform]` (see carousel.ts), a 4th instance of the
// established "deliberate inline-style exception" pattern (Progress's
// fill-width, Tree's indent-depth, Skeleton's width/height): a continuous
// active-index + live-drag-distance offset that can't be expressed as
// discrete cva variants.
export const carouselRootStyles = 'relative w-full';
export const carouselViewportStyles =
  'relative overflow-hidden rounded-lg touch-pan-y focus-visible:outline-none';
export const carouselTrackBaseStyles = 'flex';
export const carouselTrackTransitionStyles =
  'transition-transform duration-300 ease-in-out motion-reduce:transition-none';
export const carouselTrackNoTransitionStyles = 'transition-none';
export const carouselSlideStyles = 'w-full flex-shrink-0';
// A filled, circular scrim rather than dg-button's default rectangular
// "text" shape — these controls float over arbitrary consumer-supplied
// slide content (unlike e.g. Pagination's identical text-variant arrows,
// which only ever sit on a plain page background), so they need an opaque
// background to stay visible regardless of what's behind them. cn()'s
// tailwind-merge resolves the conflicting rounded-md/sizing classes from
// buttonStyles cleanly — no !important needed.
export const carouselPrevArrowStyles =
  'absolute left-2 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full p-0 shadow-md';
export const carouselNextArrowStyles =
  'absolute right-2 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full p-0 shadow-md';
export const carouselIndicatorsStyles =
  'flex items-center justify-center gap-2 pt-3';
export const carouselPlayToggleStyles =
  'absolute bottom-2 right-2 z-10 rounded-full shadow-md';

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
