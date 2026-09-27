/** `'stacked'` groups the increment/decrement buttons into a bordered mini-column at the trailing end instead of flanking the input. */
export type DynamoInputNumberButtonLayout = 'horizontal' | 'stacked';

export type DynamoInputNumberPart =
  | 'root'
  | 'input'
  | 'decrementButton'
  | 'incrementButton'
  | 'prefix'
  | 'suffix';
