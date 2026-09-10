import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  model,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoPagination } from '@dynamong/pagination';
import { cn } from '@dynamong/utils/class-merge';
import {
  dataViewEmptyStyles,
  dataViewGridStyles,
  dataViewHeaderStyles,
  dataViewListStyles,
  dataViewRootStyles,
} from './data-view.styles';
import type {
  DynamoDataViewItemContext,
  DynamoDataViewLayout,
  DynamoDataViewPart,
} from './data-view.types';

/**
 * Renders a data set as a paged list or card grid, delegating each item's
 * markup to a single projected `<ng-template let-item let-i="index">` — the
 * same "component owns a captured template + `NgTemplateOutlet`" idiom as
 * `DynamoTable`'s `cellTemplate` and `DynamoVirtualScroll`. Client-side
 * paging (via the embedded `DynamoPagination`) and an optional client-side
 * sort are built in; pass `[paginator]="false"` to render every item.
 */
@Component({
  selector: 'dg-data-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DynamoPagination],
  templateUrl: './data-view.html',
})
export class DynamoDataView<T = unknown> extends DynamoBaseComponent<DynamoDataViewPart> {
  /** The full data set — sorting and paging are applied to a copy, never mutating this. */
  readonly value = input.required<readonly T[]>();
  /** Two-way bindable so an external layout toggle can drive it. */
  readonly layout = model<DynamoDataViewLayout>('list');
  /** Rows per page. Two-way bindable; mirrors `DynamoPagination.pageSize`. */
  readonly rows = model(10);
  /** 1-indexed current page. Two-way bindable; mirrors `DynamoPagination.page`. */
  readonly page = model(1);
  readonly paginator = input(true);
  readonly rowsPerPageOptions = input<number[]>([10, 25, 50]);
  /** When set, the data is sorted by this field before paging; `null` preserves input order. */
  readonly sortField = model<keyof T | null>(null);
  readonly sortOrder = model<1 | -1>(1);
  /** Field used to `@for`-track items across re-sorts/re-pages; falls back to identity. */
  readonly dataKey = input<keyof T | undefined>(undefined);
  readonly emptyMessage = input('No records found');

  protected readonly itemTemplate = contentChild.required<
    TemplateRef<DynamoDataViewItemContext<T>>
  >(TemplateRef);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(dataViewRootStyles, this.styleClass()),
  );
  protected readonly headerClasses = dataViewHeaderStyles;
  protected readonly listClasses = dataViewListStyles;
  protected readonly gridClasses = dataViewGridStyles;
  protected readonly emptyClasses = dataViewEmptyStyles;

  private readonly sortedValue = computed<readonly T[]>(() => {
    const field = this.sortField();
    if (field === null) return this.value();
    const order = this.sortOrder();
    return [...this.value()].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av < bv) return -order;
      if (av > bv) return order;
      return 0;
    });
  });

  protected readonly pagedValue = computed<readonly T[]>(() => {
    const sorted = this.sortedValue();
    if (!this.paginator()) return sorted;
    const start = (this.page() - 1) * this.rows();
    return sorted.slice(start, start + this.rows());
  });

  protected trackItem = (item: T): unknown => {
    const key = this.dataKey();
    return key ? item[key] : item;
  };
}
