export interface DynamoBreadcrumbItem {
  label: string;
  href?: string;
}

export type DynamoBreadcrumbPart = 'root' | 'item' | 'link' | 'separator';
