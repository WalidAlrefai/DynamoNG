import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — scroll-top.html only ever binds `[class]="rootClasses()"`. No
// `cva()` call here — ScrollTop has no size/severity/state variants, just a
// single fixed appearance.
export const scrollTopStyles =
  'fixed bottom-6 end-6 z-50 flex h-10 w-10 items-center justify-center rounded-full ' +
  'bg-primary text-on-primary shadow-lg transition-colors hover:bg-primary/90 ' +
  focusRingClass;
