import type { DynamoSize } from '@dynamong/core/api';

export type DynamoInputTextSize = DynamoSize;
export type DynamoInputTextType =
  'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
export type DynamoInputTextVariant = 'outlined' | 'filled';
export type DynamoInputTextPart = 'root' | 'input';
