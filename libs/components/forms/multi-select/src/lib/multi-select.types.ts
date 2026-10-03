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
  | 'clear'
  | 'chipInput';

export type {
  DynamoSelectOption,
  DynamoSelectPosition,
  DynamoSelectSize,
  DynamoSelectVariant,
} from '@dynamong/select';
