/**
 * The shared control-size scale for field-shaped components — one place for the
 * height · inline-padding · font-size triple that was copy-pasted across ~15
 * `*.styles.ts` files (Button, Input Text, Select, Date Picker, Password, …).
 *
 * Spread it into a component's own `class-variance-authority` config:
 *
 * ```ts
 * import { cva } from 'class-variance-authority';
 * import { controlSizeVariants } from '@dynamong/utils/styles';
 *
 * export const fooStyles = cva('…base…', {
 *   variants: { size: controlSizeVariants, … },
 *   defaultVariants: { size: 'md' },
 * });
 * ```
 *
 * A component with a documented divergence layers a `compoundVariant` on top and
 * lets `cn()` / `tailwind-merge` resolve the clash — e.g. Button's wider `lg`
 * inline padding is `compoundVariants: [{ size: 'lg', class: 'px-6' }]`.
 *
 * The heights (`h-8/10/12`) and paddings ride Tailwind's `--spacing` scale, which
 * the preset rebinds to `--dg-spacing-unit`, so the whole scale rescales with a
 * theme's density setting without touching this file.
 */
export const controlSizeVariants = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
} as const;

export type DynamoControlSize = keyof typeof controlSizeVariants;
