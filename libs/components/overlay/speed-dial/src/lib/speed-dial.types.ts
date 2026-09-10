export interface DynamoSpeedDialAction {
  /** Accessible name — used for the button's `aria-label` and native tooltip. */
  label: string;
  /** Optional short glyph/text rendered in the action button (falls back to the label's first letter). */
  icon?: string;
  disabled?: boolean;
  command?: () => void;
}

export type DynamoSpeedDialDirection = 'up' | 'down' | 'left' | 'right';

export type DynamoSpeedDialType =
  | 'linear'
  | 'circle'
  | 'semi-circle'
  | 'quarter-circle';

export type DynamoSpeedDialPart = 'root' | 'trigger' | 'list' | 'action';
