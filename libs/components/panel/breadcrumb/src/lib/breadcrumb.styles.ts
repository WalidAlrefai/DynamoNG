// The only place Tailwind utility classes are allowed to live for this
// component — breadcrumb.html only ever binds `[class]="...Classes"`. No
// cva() needed at all — a crumb is either link/current/plain by pure
// template branching, not a visual variant axis.
export const breadcrumbListStyles = 'flex flex-wrap items-center gap-1 text-sm';
export const breadcrumbItemStyles = 'inline-flex items-center gap-1';
export const breadcrumbLinkStyles =
  'inline-flex items-center gap-1 text-text-muted transition-colors hover:text-primary';
export const breadcrumbCurrentStyles =
  'inline-flex items-center gap-1 font-medium text-text-primary';
export const breadcrumbPlainStyles =
  'inline-flex items-center gap-1 text-text-muted';
export const breadcrumbSeparatorStyles = 'text-text-muted';
export const breadcrumbIconClasses = 'shrink-0';
