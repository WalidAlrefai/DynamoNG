import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';

export interface DynamoMeterItem {
  label: string;
  value: number;
  /** Palette colour for the segment and its legend swatch. */
  severity?: DynamoSeverity;
  /** Explicit CSS colour string — overrides `severity` when set. */
  color?: string;
}

export type DynamoMeterGroupOrientation = 'horizontal' | 'vertical';

export type DynamoMeterGroupSize = DynamoSize;

export type DynamoMeterGroupPart =
  | 'root'
  | 'track'
  | 'meter'
  | 'legend'
  | 'legendItem'
  | 'legendMarker';
