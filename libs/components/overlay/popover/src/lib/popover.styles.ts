import { overlayPanelClass } from '@dynamong/utils/styles';

// The only place Tailwind utility classes are allowed to live for this
// component — popover.html only ever binds `[class]="...Classes"`. No
// cva() here at all — unlike most components, nothing about Popover's own
// visual styling varies by `position` (that only changes which corner CDK
// resolves the overlay to), so there are no variants to express.
export const popoverTriggerStyles = 'inline-block cursor-pointer';

export const popoverPanelStyles =
  'z-popover min-w-[12rem] p-4 focus-visible:outline-none ' + overlayPanelClass;
