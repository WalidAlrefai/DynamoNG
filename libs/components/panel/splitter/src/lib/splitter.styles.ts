import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — splitter.html only ever binds `[class]="...Classes()"`, except
// each panel's `[style.flex]` and each divider's `[style.width/height]` (see
// splitter.ts), continuous computed values with no discrete class variant
// that could express them — same "deliberate inline-style exception"
// pattern as Progress/Tree/Skeleton/Carousel/Slider/ColorPicker.
export const splitterRootStyles = cva('flex w-full', {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export const splitterPanelStyles = 'min-w-0 min-h-0 overflow-auto';

export const splitterDividerStyles = cva(
  'shrink-0 bg-border transition-colors hover:bg-primary/40 focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      orientation: {
        horizontal: 'cursor-col-resize',
        vertical: 'cursor-row-resize',
      },
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { orientation: 'horizontal', disabled: false },
  },
);
