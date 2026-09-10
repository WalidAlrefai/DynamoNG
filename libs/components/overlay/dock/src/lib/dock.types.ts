export interface DynamoDockItem {
  /** Accessible name and the caption shown on hover/focus. */
  label: string;
  /** Short glyph/text rendered in the tile; falls back to the label's first letter. */
  icon?: string;
  disabled?: boolean;
  command?: () => void;
}

export type DynamoDockPosition = 'bottom' | 'top' | 'left' | 'right';

export type DynamoDockPart = 'root' | 'list' | 'item' | 'icon' | 'label';
