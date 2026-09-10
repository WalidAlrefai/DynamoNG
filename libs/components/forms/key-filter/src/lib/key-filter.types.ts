/**
 * Named keystroke-filter presets. Each maps to a `RegExp` that a candidate
 * *full field value* must satisfy for the keystroke to be allowed — see
 * `key-filter-patterns.ts`. A custom `RegExp` can be passed instead of a
 * preset name.
 */
export type DynamoKeyFilterPreset =
  | 'int'
  | 'pint'
  | 'num'
  | 'pnum'
  | 'money'
  | 'hex'
  | 'alpha'
  | 'alphanum'
  | 'email';

export type DynamoKeyFilterPattern = DynamoKeyFilterPreset | RegExp;
