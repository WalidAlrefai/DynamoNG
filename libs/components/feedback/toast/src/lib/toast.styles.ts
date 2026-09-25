import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — toast-container.html only ever binds `[class]="...Classes()"`.
export const toastContainerStyles = 'flex flex-col gap-2';

// `phase` (entering/visible/leaving) drives the fade; `slide` — derived from
// the toast's own `position` in toast-container.ts's `cardClasses()` — is the
// screen edge it enters from and returns to: right-/left-anchored toasts
// slide in horizontally from their own edge, centered ones from above/below.
// Entering and leaving share the offset, so a dismissed toast slides back out
// the way it came in.
//
// Tailwind v4 implements `translate-*` as the separate `translate` CSS
// property (not `transform`), so it must be listed explicitly or only the
// fade animates. The `leaving` duration must stay in sync with
// toast.service.ts's LEAVE_DURATION_MS.
export const toastCardStyles = cva(
  'flex items-start gap-3 rounded-md border-s-4 bg-surface-0 p-4 text-sm text-text-primary shadow-lg ' +
    'transition-[opacity,transform,translate] duration-300 ease-out motion-reduce:transition-none',
  {
    variants: {
      severity: {
        primary: 'border-primary',
        secondary: 'border-secondary',
        success: 'border-success',
        info: 'border-info',
        warning: 'border-warning',
        danger: 'border-danger',
      },
      slide: {
        right: '',
        left: '',
        top: '',
        bottom: '',
      },
      phase: {
        entering: 'opacity-0',
        visible: 'translate-x-0 translate-y-0 opacity-100',
        leaving: 'opacity-0 duration-200 ease-in',
      },
    },
    compoundVariants: [
      ...(['entering', 'leaving'] as const).flatMap((phase) => [
        {
          slide: 'right' as const,
          phase,
          class: 'translate-x-[calc(100%+1rem)]',
        },
        {
          slide: 'left' as const,
          phase,
          class: '-translate-x-[calc(100%+1rem)]',
        },
        {
          slide: 'top' as const,
          phase,
          class: '-translate-y-[calc(100%+1rem)]',
        },
        {
          slide: 'bottom' as const,
          phase,
          class: 'translate-y-[calc(100%+1rem)]',
        },
      ]),
    ],
    defaultVariants: { severity: 'info', slide: 'right', phase: 'visible' },
  },
);

export const toastIconStyles = cva('mt-0.5 h-5 w-5 shrink-0', {
  variants: {
    severity: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-success',
      info: 'text-info',
      warning: 'text-warning',
      danger: 'text-danger',
    },
  },
  defaultVariants: { severity: 'info' },
});

export const toastTitleStyles = 'font-medium text-text-primary';
export const toastMessageStyles = 'text-text-muted';

export const toastCloseButtonStyles =
  'ms-auto shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-100 ' +
  'hover:text-text-primary ' +
  focusRingClass;
