// The only place Tailwind utility classes are allowed to live for this
// component — toolbar.html only ever binds `[class]="...Classes"`. No `cva()`
// call here — Toolbar has no size/severity/state variants, just fixed layout.
export const toolbarRootStyles = 'flex w-full items-center justify-between gap-2';
export const toolbarStartStyles = 'flex shrink-0 items-center gap-2';
export const toolbarCenterStyles = 'flex flex-1 items-center justify-center gap-2';
export const toolbarEndStyles = 'flex shrink-0 items-center gap-2';
