import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — pagination.html only ever binds `[class]="...Classes()"`, or
// passes one of the `*ExtraClasses` exports below as `[styleClass]` to a
// reused `DynamoButton`/`DynamoSelect` (resolved via `cn()`'s tailwind-merge
// against that component's own built-in classes).
export const paginationStyles = cva(
  'flex flex-wrap items-center justify-between gap-4 text-text-primary',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const paginationSummaryStyles = 'text-text-muted';

export const paginationControlsStyles = 'flex items-center gap-1';

// Square, icon-only sizing for the Prev/Next `DynamoButton`s — Button's own
// `size` variant only fixes height, so without this the icon sits inside a
// wide rectangle (`px-3`/`px-4`/`px-5`) instead of a square hit target.
export const paginationNavButtonExtraClasses = cva('shrink-0 px-0', {
  variants: {
    size: {
      sm: 'w-8',
      md: 'w-10',
      lg: 'w-12',
    },
  },
  defaultVariants: { size: 'md' },
});

// Same square-sizing rationale as `paginationNavButtonExtraClasses`, for
// numbered page buttons. `active` only tweaks weight — the active/inactive
// color distinction itself comes entirely from `DynamoButton`'s own
// `severity`/`variant` inputs (solid primary vs. text secondary), not from
// styleClass overrides here.
export const paginationPageButtonExtraClasses = cva('shrink-0 px-0', {
  variants: {
    size: {
      sm: 'w-8',
      md: 'w-10',
      lg: 'w-12',
    },
    active: {
      true: 'font-semibold',
      false: 'font-normal',
    },
  },
  defaultVariants: { size: 'md', active: false },
});

// Matches the nav/page buttons' own size so the "..." markers stay aligned
// to the same row height/width instead of visually floating.
export const paginationEllipsisStyles = cva(
  'flex select-none items-center justify-center text-text-muted',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const paginationPageSizeSelectStyles = 'w-auto min-w-[8rem]';
