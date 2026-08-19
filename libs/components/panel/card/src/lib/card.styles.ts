import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — card.html only ever binds `[class]="...Classes()"`.
//
// Every class below is a static, literal string (never interpolated) so
// Tailwind's content scanner can find it — same constraint documented in
// button.styles.ts.
export const cardStyles = cva('overflow-hidden rounded-lg text-text-primary', {
  variants: {
    variant: {
      elevated: 'bg-surface-0 shadow-md',
      outlined: 'border border-border bg-surface-0',
      filled: 'bg-surface-100',
    },
  },
  defaultVariants: {
    variant: 'elevated',
  },
});

export const cardHeaderStyles = 'border-b border-border px-4 py-3';
export const cardTitleStyles = 'text-base font-semibold text-text-primary';
export const cardSubtitleStyles = 'mt-0.5 text-sm text-text-muted';
export const cardBodyStyles = 'p-4';
export const cardFooterStyles =
  'flex items-center gap-2 border-t border-border px-4 py-3';
