import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  effect,
  input,
  model,
  output,
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
  DynamoDataViewLazyLoadEvent,
  DynamoDataViewPaginatorPosition,
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
export class DynamoDataView<
  T = unknown,
> extends DynamoBaseComponent<DynamoDataViewPart> {
  /** The full data set — sorting and paging are applied to a copy, never mutating this. */
  readonly value = input.required<readonly T[]>();
  /** Two-way bindable so an external layout toggle can drive it. */
  readonly layout = model<DynamoDataViewLayout>('list');
  /** Rows per page. Two-way bindable; mirrors `DynamoPagination.pageSize`. */
  readonly rows = model(10);
  /** 1-indexed current page. Two-way bindable; mirrors `DynamoPagination.page`. */
  readonly page = model(1);
  readonly paginator = input(true);
  /** Where the paginator renders relative to the content — matches DynamoNG's existing bottom-only behavior as the default. */
  readonly paginatorPosition = input<DynamoDataViewPaginatorPosition>('bottom');
  readonly rowsPerPageOptions = input<number[]>([10, 25, 50]);
  /** When set, the data is sorted by this field before paging; `null` preserves input order. Ignored in `lazy` mode — the consumer's own `value` is assumed already sorted. */
  readonly sortField = model<keyof T | null>(null);
  readonly sortOrder = model<1 | -1>(1);
  /** Field used to `@for`-track items across re-sorts/re-pages; falls back to identity. Superseded by `trackBy` when both are set. */
  readonly dataKey = input<keyof T | undefined>(undefined);
  /** A full track function, mirroring `DynamoTable`'s own `trackBy` — takes priority over `dataKey` when both are set. */
  readonly trackBy = input<((item: T, index: number) => unknown) | undefined>(
    undefined,
  );
  readonly emptyMessage = input('No records found');
  /**
   * Opt-in server-side mode: `value` is expected to hold only the *current
   * page's* (already-sorted) items, and `totalRecords` — not `value.length`
   * — drives the paginator's page count. `DynamoDataView` no longer sorts
   * or slices `value` itself; it only emits `lazyLoad` whenever the page,
   * page size, or sort changes, and the consumer re-fetches and re-binds
   * `value` in response.
   */
  readonly lazy = input(false);
  /** Required in `lazy` mode to compute the correct page count from a `value` that only holds the current page. Ignored otherwise. */
  readonly totalRecords = input<number | undefined>(undefined);
  readonly lazyLoad = output<DynamoDataViewLazyLoadEvent<T>>();

  protected readonly itemTemplate =
    contentChild.required<TemplateRef<DynamoDataViewItemContext<T>>>(
      TemplateRef,
    );

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(dataViewRootStyles, this.styleClass()),
  );
  protected readonly headerClasses = dataViewHeaderStyles;
  protected readonly listClasses = dataViewListStyles;
  protected readonly gridClasses = dataViewGridStyles;
  protected readonly emptyClasses = dataViewEmptyStyles;

  /** In `lazy` mode, `value` already holds exactly the current page's sorted items — sorting it again here would be redundant (and wrong, since it's only a page, not the full set). */
  private readonly sortedValue = computed<readonly T[]>(() => {
    if (this.lazy()) return this.value();
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
    if (this.lazy() || !this.paginator()) return sorted;
    const start = (this.page() - 1) * this.rows();
    return sorted.slice(start, start + this.rows());
  });

  /** The paginator's total-item count — `totalRecords` in `lazy` mode (where `value` is only ever one page), else `value`'s own length. */
  protected readonly totalItemCount = computed(() =>
    this.lazy()
      ? (this.totalRecords() ?? this.value().length)
      : this.value().length,
  );

  protected trackItem = (item: T, index: number): unknown => {
    const fn = this.trackBy();
    if (fn) return fn(item, index);
    const key = this.dataKey();
    return key ? item[key] : item;
  };

  constructor() {
    super();

    // Fires `lazyLoad` whenever page/rows/sort changes, skipping the
    // initial run — only meaningful in `lazy` mode, where the consumer is
    // expected to re-fetch and re-bind `value` in response. page/rows
    // changes usually originate from the embedded `<dg-pagination>`'s own
    // two-way binding; sortField/sortOrder have no built-in UI trigger of
    // their own and are always driven by the consumer's own projected
    // content, so an effect (rather than a single call-site handler, the
    // way Table/TreeTable avoid effects) is the only place all four
    // sources of change can be observed uniformly.
    let isFirstRun = true;
    effect(() => {
      const page = this.page();
      const rows = this.rows();
      const sortField = this.sortField();
      const sortOrder = this.sortOrder();
      if (isFirstRun) {
        isFirstRun = false;
        return;
      }
      if (!this.lazy()) return;
      this.lazyLoad.emit({
        first: (page - 1) * rows,
        rows,
        sortField,
        sortOrder,
      });
    });
  }
}
