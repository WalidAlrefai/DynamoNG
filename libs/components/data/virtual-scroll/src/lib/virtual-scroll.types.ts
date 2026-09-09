export type DynamoVirtualScrollPart = 'root' | 'viewport';

/**
 * Template context handed to the projected `<ng-template>`, matching
 * Angular's `let item` / `let-x="name"` template-variable conventions —
 * the same shape as `DynamoTableCellContext`.
 */
export interface DynamoVirtualScrollItemContext<T> {
  /** The item itself. Bind with Angular's implicit shorthand: `let item`. */
  $implicit: T;
  /** Same value as `$implicit`, available under an explicit name: `let-item="item"`. */
  item: T;
  index: number;
}
