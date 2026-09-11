import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — image-gallery.html only ever binds `[class]="...Classes()"`.
export const imageGalleryRootStyles = 'w-full space-y-3';

// `aspectRatio` is a real visual variant axis, same idiom as every other
// small-enum-driven `size`/`severity` input elsewhere in the codebase.
export const imageGalleryViewportStyles = cva(
  'group relative w-full overflow-hidden rounded-lg bg-surface-100',
  {
    variants: {
      aspectRatio: {
        square: 'aspect-square',
        video: 'aspect-video',
        wide: 'aspect-[21/9]',
      },
    },
    defaultVariants: { aspectRatio: 'video' },
  },
);

export const imageGalleryMainButtonStyles =
  'block h-full w-full cursor-zoom-in ' + focusRingClass;

export const imageGalleryMainImageStyles = 'h-full w-full object-cover';

// Same filled circular scrim shape as Carousel's arrows (carouselPrevArrowStyles/
// carouselNextArrowStyles) — these float over arbitrary image content, so they
// need an opaque background to stay visible regardless of what's behind them.
export const imageGalleryPrevArrowStyles =
  'absolute start-2 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full p-0 shadow-md ' +
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';
export const imageGalleryNextArrowStyles =
  'absolute end-2 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full p-0 shadow-md ' +
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';

export const imageGalleryThumbnailsStyles = 'flex gap-2 overflow-x-auto pb-1';

// The two states here are a real visual variant axis, same shape as Editor's
// `active` button variant (editorButtonStyles) and Carousel's `active` dot
// variant (carouselDotStyles).
export const imageGalleryThumbnailStyles = cva(
  'h-14 w-14 shrink-0 overflow-hidden rounded-md transition-all ' +
    focusRingClass,
  {
    variants: {
      // No border/ring on the active thumbnail — full opacity vs. the
      // dimmed inactive ones is the only selected-state indicator now.
      active: {
        true: '',
        false: 'opacity-70 hover:opacity-100',
      },
    },
    defaultVariants: { active: false },
  },
);

export const imageGalleryThumbnailImageStyles = 'h-full w-full object-cover';

export const imageGalleryFallbackStyles =
  'flex h-full w-full items-center justify-center bg-surface-200 text-text-muted';

// Lightbox: a `position: fixed` full-viewport backdrop + panel, same shape as
// Dialog's (dialogPanelStyles) — deliberately not CDK Overlay/Portal, matching
// how every overlay-domain component in this codebase (Dialog, Drawer,
// Tooltip) independently implements its own fixed-position shape rather than
// composing another component.
export const imageGalleryLightboxBackdropStyles =
  'fixed inset-0 z-modal bg-surface-900/90';

export const imageGalleryLightboxPanelStyles =
  'fixed inset-0 z-modal flex flex-col items-center justify-center gap-4 p-4 outline-none';

export const imageGalleryLightboxImageStyles =
  'max-h-[80vh] max-w-full object-contain';

export const imageGalleryLightboxCaptionStyles =
  'max-w-2xl text-center text-sm text-surface-0';

// Near-identical to dialogCloseButtonStyles, adjusted for the dark lightbox
// backdrop instead of the light dialog panel background.
export const imageGalleryLightboxCloseButtonStyles =
  'absolute end-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full ' +
  'bg-surface-0/10 text-surface-0 transition-colors hover:bg-surface-0/20 ' +
  focusRingClass;

export const imageGalleryLightboxPrevArrowStyles =
  'absolute start-4 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full p-0 shadow-md';
export const imageGalleryLightboxNextArrowStyles =
  'absolute end-4 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full p-0 shadow-md';
