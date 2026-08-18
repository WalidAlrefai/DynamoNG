import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — switch.html only ever binds `[class]="...Classes()"`.
export const switchRootStyles = cva(
  'inline-flex items-center gap-2 select-none',
  {
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: { disabled: false },
  },
);

export const switchTrackStyles = cva(
  'relative inline-block shrink-0 rounded-full border transition-colors ' +
    'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-4 w-8',
        md: 'h-5 w-10',
        lg: 'h-6 w-12',
      },
      checked: {
        true: 'bg-primary border-primary',
        // surface-200 (not surface-0 — that's the page's own base color) so
        // the track always reads as a distinct control against a white page,
        // not just a bordered rectangle the same color as its surroundings.
        false: 'bg-surface-200 border-border',
      },
    },
    defaultVariants: { size: 'md', checked: false },
  },
);

// Thumb travel distance intentionally reuses the same Tailwind step as the
// track's own height per size (h-4/h-5/h-6 <-> translate-x-4/5/6) — with a
// constant 2px (left-0.5) inset on both sides, that's exactly the distance
// from the track's left edge to its right edge for the thumb's own size.
export const switchThumbStyles = cva(
  'absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-surface-0 shadow-sm ' +
    'transition-transform duration-150 motion-reduce:transition-none',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
      checked: {
        true: '',
        false: 'translate-x-0',
      },
    },
    compoundVariants: [
      { size: 'sm', checked: true, class: 'translate-x-4' },
      { size: 'md', checked: true, class: 'translate-x-5' },
      { size: 'lg', checked: true, class: 'translate-x-6' },
    ],
    defaultVariants: { size: 'md', checked: false },
  },
);
