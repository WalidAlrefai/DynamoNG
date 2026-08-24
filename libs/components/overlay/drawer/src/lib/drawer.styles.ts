import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — drawer.html only ever binds `[class]="...Classes()"`.
//
// `size` resolves to width for left/right and height for top/bottom (same
// rem scale Dialog's `dialogPanelStyles` uses for sm/md/lg, so the two
// overlay components stay visually consistent). `visible` drives the
// slide transform per edge — see drawer.ts's animation state machine for
// why the class flip is deferred a frame rather than applied immediately.
export const drawerPanelStyles = cva(
  'fixed z-10 flex flex-col overflow-y-auto border-border bg-surface-0 p-6 shadow-lg ' +
    'transition-transform duration-200 motion-reduce:transition-none focus:outline-none',
  {
    variants: {
      position: {
        left: 'inset-y-0 left-0 border-r',
        right: 'inset-y-0 right-0 border-l',
        top: 'inset-x-0 top-0 border-b',
        bottom: 'inset-x-0 bottom-0 border-t',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      visible: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { position: 'left', size: 'sm', class: 'w-[24rem]' },
      { position: 'left', size: 'md', class: 'w-[28rem]' },
      { position: 'left', size: 'lg', class: 'w-[32rem]' },
      { position: 'right', size: 'sm', class: 'w-[24rem]' },
      { position: 'right', size: 'md', class: 'w-[28rem]' },
      { position: 'right', size: 'lg', class: 'w-[32rem]' },
      { position: 'top', size: 'sm', class: 'h-[24rem]' },
      { position: 'top', size: 'md', class: 'h-[28rem]' },
      { position: 'top', size: 'lg', class: 'h-[32rem]' },
      { position: 'bottom', size: 'sm', class: 'h-[24rem]' },
      { position: 'bottom', size: 'md', class: 'h-[28rem]' },
      { position: 'bottom', size: 'lg', class: 'h-[32rem]' },
      { position: 'left', visible: false, class: '-translate-x-full' },
      { position: 'left', visible: true, class: 'translate-x-0' },
      { position: 'right', visible: false, class: 'translate-x-full' },
      { position: 'right', visible: true, class: 'translate-x-0' },
      { position: 'top', visible: false, class: '-translate-y-full' },
      { position: 'top', visible: true, class: 'translate-y-0' },
      { position: 'bottom', visible: false, class: 'translate-y-full' },
      { position: 'bottom', visible: true, class: 'translate-y-0' },
    ],
    defaultVariants: { position: 'right', size: 'md', visible: false },
  },
);

export const drawerCloseButtonStyles =
  'inline-flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors ' +
  'hover:bg-surface-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
