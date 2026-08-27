import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';

export type DynamoPasswordSize = DynamoSize;
export type DynamoPasswordPart = 'root' | 'input' | 'toggle' | 'meter';
export type DynamoPasswordStrengthLabel = 'weak' | 'medium' | 'strong';

export interface DynamoPasswordStrength {
  score: number;
  percent: number;
  label: DynamoPasswordStrengthLabel;
  severity: DynamoSeverity;
}
