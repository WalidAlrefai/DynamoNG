// The only place Tailwind utility classes are allowed to live for this
// component — popover.html only ever binds `[class]="...Classes"`. No
// cva() here at all — unlike most components, nothing about Popover's own
// visual styling varies by `position` (that only changes which corner CDK
// resolves the overlay to), so there are no variants to express.
export const popoverTriggerStyles = 'inline-block cursor-pointer';

export const popoverPanelStyles =
  'z-10 min-w-[12rem] rounded-md border border-border bg-surface-0 p-4 shadow-lg focus-visible:outline-none';
