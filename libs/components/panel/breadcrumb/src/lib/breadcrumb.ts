import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  breadcrumbCurrentStyles,
  breadcrumbIconClasses,
  breadcrumbItemStyles,
  breadcrumbLinkStyles,
  breadcrumbListStyles,
  breadcrumbPlainStyles,
  breadcrumbSeparatorStyles,
} from './breadcrumb.styles';
import type {
  DynamoBreadcrumbItem,
  DynamoBreadcrumbPart,
} from './breadcrumb.types';

@Component({
  selector: 'dg-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumb.html',
})
// A dedicated `home`/`homeAriaLabel` (an icon-only leading crumb) is
// intentionally not offered: `items` accepts per-item `icon`, so
// `{ label: 'Home', icon: '🏠', href: '/' }` already covers the same
// navigational need without a separate shortcut input. See README.
export class DynamoBreadcrumb extends DynamoBaseComponent<DynamoBreadcrumbPart> {
  readonly items = input.required<DynamoBreadcrumbItem[]>();
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly listClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(breadcrumbListStyles, this.styleClass()),
  );
  protected readonly itemClasses = breadcrumbItemStyles;
  protected readonly linkClasses = breadcrumbLinkStyles;
  protected readonly currentClasses = breadcrumbCurrentStyles;
  protected readonly plainClasses = breadcrumbPlainStyles;
  protected readonly separatorClasses = breadcrumbSeparatorStyles;
  protected readonly iconClasses = breadcrumbIconClasses;
}
