import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — scroll-top.html only ever binds `[class]="rootClasses()"`.
export const scrollTopStyles = cva(
  'end-6 z-50 flex h-10 w-10 items-center justify-center rounded-full ' +
    'bg-primary text-on-primary shadow-lg transition-colors hover:bg-primary/90 ' +
    focusRingClass,
  {
    variants: {
      // `target: 'window'` is fixed to the viewport; `target: 'parent'`
      // instead needs `absolute`, anchored within the consumer's own
      // `position: relative` scrollable container (see this library's
      // README), so it doesn't float over the rest of the page.
      target: {
        window: 'fixed bottom-6',
        parent: 'absolute bottom-2',
      },
    },
    defaultVariants: { target: 'window' },
  },
);
