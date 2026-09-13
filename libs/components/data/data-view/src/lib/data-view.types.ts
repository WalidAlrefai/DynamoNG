export type DynamoDataViewLayout = 'list' | 'grid';
export type DynamoDataViewPaginatorPosition = 'top' | 'bottom' | 'both';

export type DynamoDataViewPart =
  'root' | 'header' | 'content' | 'grid' | 'list' | 'emptyMessage';

/** Context object handed to the projected `<ng-template>` for each rendered item. */
export interface DynamoDataViewItemContext<T> {
  $implicit: T;
  item: T;
  index: number;
}

/**
 * Emitted from `lazy` mode whenever the page, page size, or sort changes —
 * a consumer fetches the matching slice from its own data source and feeds
 * it back in via `value`/`totalRecords`, rather than `DynamoDataView`
 * sorting/slicing the full set itself.
 */
export interface DynamoDataViewLazyLoadEvent<T> {
  /** 0-indexed offset of the first row on the current page — `(page - 1) * rows`. */
  first: number;
  rows: number;
  sortField: keyof T | null;
  sortOrder: 1 | -1;
}
