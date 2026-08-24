import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — divider.html only ever binds `[class]="...Classes()"`.
export const dividerLineStyles = cva('border-border', {
  variants: {
    orientation: {
      horizontal: 'border-t flex-1',
      vertical: 'border-l self-stretch',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const dividerLabelStyles = 'px-3 text-sm text-text-muted';
