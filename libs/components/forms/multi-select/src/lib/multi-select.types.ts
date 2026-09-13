export type DynamoMultiSelectPart =
  | 'root'
  | 'trigger'
  | 'tag'
  | 'tagRemove'
  | 'overflowTag'
  | 'chevron'
  | 'listbox'
  | 'group'
  | 'option'
  | 'optionCheckbox'
  | 'filterInput'
  | 'selectAll'
  | 'clearAll'
  | 'clearButton';

export type {
  DynamoSelectOption,
  DynamoSelectPosition,
  DynamoSelectSize,
} from '@dynamong/select';
