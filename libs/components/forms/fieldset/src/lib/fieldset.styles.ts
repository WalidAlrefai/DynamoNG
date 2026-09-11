import { cva } from 'class-variance-authority';
import { focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — fieldset.html only ever binds `[class]="...Classes()"`.
// Lives on the native <fieldset> itself — border/rounded/padding, plus the
// disabled dimming every other component's own `disabled` variant gets
// (here it's real: the native `disabled` attribute below cascades to every
// descendant form control for free, this is only the visual half).
export const fieldsetStyles = cva('rounded-lg border border-border p-4', {
  variants: {
    disabled: {
      true: 'opacity-60',
      false: '',
    },
  },
  defaultVariants: { disabled: false },
});

export const fieldsetLegendStyles =
  'flex items-center gap-1.5 px-1 text-sm font-semibold text-text-primary';

// Same shape as Panel's header-button chrome — the toggle sits *inside* the
// native <legend> (legal HTML: legend accepts phrasing content) rather than
// legend being replaced by a synthetic header the way Panel's collapsible
// header is.
export const fieldsetToggleButtonStyles =
  'inline-flex items-center gap-1 rounded-sm transition-colors hover:text-primary ' +
  focusRingClass;

// The 0fr/1fr grid-rows trick, copied verbatim from Accordion/Panel — no
// ResizeObserver or JS height measurement.
export const fieldsetContentWrapperStyles = cva(
  'grid transition-[grid-template-rows] duration-200 ease-out',
  {
    variants: {
      expanded: {
        true: 'grid-rows-[1fr]',
        false: 'grid-rows-[0fr]',
      },
    },
    defaultVariants: { expanded: true },
  },
);

export const fieldsetContentInnerStyles = 'overflow-hidden min-h-0';
export const fieldsetContentBodyStyles = 'pt-2';

export const fieldsetChevronStyles = cva(
  'shrink-0 transition-transform duration-200 ease-out',
  {
    variants: {
      expanded: {
        true: 'rotate-180',
        false: '',
      },
    },
    defaultVariants: { expanded: true },
  },
);
