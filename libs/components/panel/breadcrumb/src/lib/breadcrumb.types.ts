export interface DynamoBreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export type DynamoBreadcrumbPart = 'root' | 'item' | 'link' | 'separator';
