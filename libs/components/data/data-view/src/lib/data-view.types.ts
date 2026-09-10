export type DynamoDataViewLayout = 'list' | 'grid';

export type DynamoDataViewPart =
  | 'root'
  | 'header'
  | 'content'
  | 'grid'
  | 'list'
  | 'emptyMessage';

/** Context object handed to the projected `<ng-template>` for each rendered item. */
export interface DynamoDataViewItemContext<T> {
  $implicit: T;
  item: T;
  index: number;
}
