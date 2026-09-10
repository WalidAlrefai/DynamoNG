// The only place Tailwind utility classes are allowed to live for this
// component — never inline in data-view.html. See @dynamong/utils/class-merge's
// `cn()` for how this composes with `styleClass`/`pt` overrides.

export const dataViewRootStyles = 'flex flex-col gap-4';

// `empty:hidden` collapses the header row when nothing is projected into the
// `[header]` slot, so consumers who don't use it never see an empty gap.
export const dataViewHeaderStyles =
  'flex items-center justify-between gap-3 empty:hidden';

// List layout: a single bordered column with hairline separators between rows.
export const dataViewListStyles =
  'flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border';

// Grid layout: responsive card grid, 1 → 2 → 3 columns.
export const dataViewGridStyles =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export const dataViewEmptyStyles =
  'rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-text-muted';
