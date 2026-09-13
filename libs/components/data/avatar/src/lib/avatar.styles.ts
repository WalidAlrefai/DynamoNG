import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — avatar.html only ever binds `[class]="...Classes()"`, except
// for the static, variant-free `<img>` class (see the comment in
// avatar.html).
export const avatarRootStyles = cva(
  'inline-flex items-center justify-center overflow-hidden ' +
    'bg-surface-200 font-medium text-text-primary select-none',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: { size: 'md', shape: 'circle' },
  },
);

// A stack of overlapping avatars — negative margin pulls each child left
// under the previous one, with a ring matching the page background so the
// overlap reads as distinct circles/squares rather than a solid blob.
// Purely a layout helper around projected `<dg-avatar>` children: no
// props of its own beyond styleClass/unstyled (already on the base
// component), mirroring PrimeNG's own near-empty AvatarGroup.
export const avatarGroupRootStyles =
  'inline-flex items-center [&>*]:ring-2 [&>*]:ring-surface-0 [&>*:not(:first-child)]:-ms-3';
