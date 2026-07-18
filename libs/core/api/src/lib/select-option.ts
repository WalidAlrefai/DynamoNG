export interface DynamoSelectOption<TValue = unknown> {
  label: string;
  value: TValue;
  disabled?: boolean;
}
