import { cva } from 'class-variance-authority';
import { controlSizeVariants, focusRingClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — button.html only ever binds `[class]="classes()"`.
//
// Every class below is a static, literal string (never interpolated) so
// Tailwind's content scanner can find it — dynamically built class names
// like `bg-${severity}` are invisible to Tailwind's JIT compiler and must
// never be used, even though it would shrink this file considerably.
export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
    focusRingClass +
    ' disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      severity: {
        primary: '',
        secondary: '',
        success: '',
        info: '',
        warning: '',
        danger: '',
      },
      // Shared control-size triad; Button's one divergence (wider `lg` inline
      // padding) is layered as a compoundVariant below.
      size: controlSizeVariants,
      variant: {
        solid: '',
        outline: 'bg-transparent border',
        text: 'bg-transparent',
        // Never gets a hover background (unlike `text`'s `hover:bg-*/10`) —
        // colored text with an underline on hover only, matching PrimeNG's
        // Link button.
        link: 'bg-transparent',
      },
      // `w-full` alone (not `flex`) — the base `inline-flex` already lets an
      // explicit width stretch the button; switching display modes risks a
      // Tailwind utility-ordering conflict with that same base class.
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      raised: {
        true: 'shadow-md',
        false: '',
      },
      // Base class above already has `rounded-md` unconditionally; `cn()`'s
      // `twMerge` resolves the conflict since this variant's class is
      // appended after the base string in the final concatenation.
      rounded: {
        true: 'rounded-full',
        false: '',
      },
      // Empty placeholder — only exists so the compoundVariants below can key
      // off it per size; the actual classes live in those compoundVariants.
      iconOnly: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { size: 'lg', class: 'px-6' },

      { size: 'sm', iconOnly: true, class: 'w-8 px-0' },
      { size: 'md', iconOnly: true, class: 'w-10 px-0' },
      { size: 'lg', iconOnly: true, class: 'w-12 px-0' },

      {
        severity: 'primary',
        variant: 'solid',
        class: 'bg-primary text-on-primary hover:bg-primary-hover',
      },
      {
        severity: 'primary',
        variant: 'outline',
        class: 'text-primary border-primary hover:bg-primary/10',
      },
      {
        severity: 'primary',
        variant: 'text',
        class: 'text-primary hover:bg-primary/10',
      },
      {
        severity: 'primary',
        variant: 'link',
        class: 'text-primary underline-offset-4 hover:underline',
      },

      {
        severity: 'secondary',
        variant: 'solid',
        class: 'bg-secondary text-on-secondary hover:bg-secondary-hover',
      },
      {
        severity: 'secondary',
        variant: 'outline',
        class: 'text-secondary border-secondary hover:bg-secondary/10',
      },
      {
        severity: 'secondary',
        variant: 'text',
        class: 'text-secondary hover:bg-secondary/10',
      },
      {
        severity: 'secondary',
        variant: 'link',
        class: 'text-secondary underline-offset-4 hover:underline',
      },

      {
        severity: 'success',
        variant: 'solid',
        class: 'bg-success text-on-success hover:bg-success-hover',
      },
      {
        severity: 'success',
        variant: 'outline',
        class: 'text-success border-success hover:bg-success/10',
      },
      {
        severity: 'success',
        variant: 'text',
        class: 'text-success hover:bg-success/10',
      },
      {
        severity: 'success',
        variant: 'link',
        class: 'text-success underline-offset-4 hover:underline',
      },

      {
        severity: 'info',
        variant: 'solid',
        class: 'bg-info text-on-info hover:bg-info-hover',
      },
      {
        severity: 'info',
        variant: 'outline',
        class: 'text-info border-info hover:bg-info/10',
      },
      {
        severity: 'info',
        variant: 'text',
        class: 'text-info hover:bg-info/10',
      },
      {
        severity: 'info',
        variant: 'link',
        class: 'text-info underline-offset-4 hover:underline',
      },

      {
        severity: 'warning',
        variant: 'solid',
        class: 'bg-warning text-on-warning hover:bg-warning-hover',
      },
      {
        severity: 'warning',
        variant: 'outline',
        class: 'text-warning border-warning hover:bg-warning/10',
      },
      {
        severity: 'warning',
        variant: 'text',
        class: 'text-warning hover:bg-warning/10',
      },
      {
        severity: 'warning',
        variant: 'link',
        class: 'text-warning underline-offset-4 hover:underline',
      },

      {
        severity: 'danger',
        variant: 'solid',
        class: 'bg-danger text-on-danger hover:bg-danger-hover',
      },
      {
        severity: 'danger',
        variant: 'outline',
        class: 'text-danger border-danger hover:bg-danger/10',
      },
      {
        severity: 'danger',
        variant: 'text',
        class: 'text-danger hover:bg-danger/10',
      },
      {
        severity: 'danger',
        variant: 'link',
        class: 'text-danger underline-offset-4 hover:underline',
      },
    ],
    defaultVariants: {
      severity: 'primary',
      size: 'md',
      variant: 'solid',
      fullWidth: false,
      raised: false,
      rounded: false,
      iconOnly: false,
    },
  },
);

// Visually merges adjacent <dg-button> children into one connected control —
// a plain CSS-only wrapper, no coupling to DynamoButton's own TS API. Reaches
// one level deeper than avatarGroupRootStyles' bare [&>*] since the styled
// box (border/rounded-md) lives on Button's inner <button>, not <dg-button>
// itself. `relative`+`focus-visible:z-10` are scoped to grouped buttons only
// (not added to buttonStyles' own base), so ungrouped buttons are unaffected.
export const buttonGroupRootStyles =
  'inline-flex ' +
  '[&>dg-button>button]:relative [&>dg-button>button]:rounded-none [&>dg-button>button]:focus-visible:z-10 ' +
  '[&>dg-button:not(:first-child)>button]:-ms-px ' +
  '[&>dg-button:first-child>button]:rounded-s-md ' +
  '[&>dg-button:last-child>button]:rounded-e-md';
