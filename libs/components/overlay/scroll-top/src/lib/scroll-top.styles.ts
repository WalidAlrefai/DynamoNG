// The only place Tailwind utility classes are allowed to live for this
// component — scroll-top.html only ever binds `[class]="rootClasses()"`. No
// `cva()` call here — ScrollTop has no size/severity/state variants, just a
// single fixed appearance.
export const scrollTopStyles =
  'fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full ' +
  'bg-primary text-on-primary shadow-lg transition-colors hover:bg-primary/90 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
