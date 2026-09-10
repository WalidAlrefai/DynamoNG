import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — never inline in meter-group.html. See @dynamong/utils/class-merge's
// `cn()` for how this composes with `styleClass`/`pt` overrides.
export const meterGroupStyles = cva('', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
