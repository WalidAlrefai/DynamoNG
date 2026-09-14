import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — divider.html only ever binds `[class]="...Classes()"`.
export const dividerLineStyles = cva('border-border', {
  variants: {
    orientation: {
      horizontal: 'border-t',
      vertical: 'border-s',
    },
    lineStyle: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
    grow: {
      true: 'flex-1',
      false: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', grow: false, class: 'w-3 flex-none' },
    { orientation: 'vertical', grow: false, class: 'h-3 flex-none' },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    lineStyle: 'solid',
    grow: true,
  },
});

export const dividerLabelStyles = cva('text-sm text-text-muted', {
  variants: {
    orientation: {
      horizontal: 'px-3',
      vertical: 'py-3',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});
