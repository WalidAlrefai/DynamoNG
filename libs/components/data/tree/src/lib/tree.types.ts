export interface DynamoTreeNode<TValue = unknown> {
  id: string;
  label: string;
  value?: TValue;
  children?: DynamoTreeNode<TValue>[];
  disabled?: boolean;
}

export type DynamoTreePart =
  | 'root'
  | 'row'
  | 'checkbox'
  | 'label'
  | 'chevron'
  | 'group';
