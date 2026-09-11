import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — speed-dial.html only binds `[class]="...Classes()"` / a style
// binding for the per-action transform.

export const speedDialRootStyles = 'relative inline-flex h-12 w-12';

export const speedDialTriggerStyles = cva(
  'absolute inset-0 flex h-12 w-12 items-center justify-center rounded-full ' +
    'bg-primary text-on-primary shadow-lg transition-transform duration-200 ease-out ' +
    'disabled:cursor-not-allowed disabled:opacity-60 ' +
    focusRingClass,
  {
    variants: {
      open: { true: 'rotate-45', false: '' },
    },
    defaultVariants: { open: false },
  },
);

// The list is a zero-size box centred on the trigger; each action is
// absolutely centred on it and pushed out via a `transform` translate.
export const speedDialListStyles = cva(
  'absolute start-1/2 top-1/2 h-0 w-0 transition-opacity duration-200 ease-out',
  {
    variants: {
      open: {
        true: 'opacity-100',
        false: 'pointer-events-none opacity-0',
      },
    },
    defaultVariants: { open: false },
  },
);

export const speedDialActionStyles = cva(
  // Centring and the push-out translate are applied together via an inline
  // `transform` binding (`translate(calc(-50% + Xpx), …)`), since an inline
  // style would otherwise clobber Tailwind `-translate-*` utilities.
  'absolute start-1/2 top-1/2 flex h-10 w-10 ' +
    'items-center justify-center rounded-full bg-surface-0 text-sm text-text-primary shadow-md ' +
    'transition-transform duration-200 ease-out ' +
    'disabled:cursor-not-allowed disabled:opacity-60 ' +
    focusRingClass,
  {
    variants: {
      disabled: {
        true: '',
        false: 'hover:bg-surface-100',
      },
    },
    defaultVariants: { disabled: false },
  },
);
