export interface DynamoDockItem {
  /** Accessible name and the caption shown on hover/focus. */
  label: string;
  /** Short glyph/text rendered in the tile; falls back to the label's first letter. */
  icon?: string;
  disabled?: boolean;
  command?: () => void;
  /** Short badge (e.g. a notification count) shown at the tile's corner. Folded into the tile's own `aria-label` — not read separately. */
  badge?: string | number;
}

export type DynamoDockPosition = 'bottom' | 'top' | 'left' | 'right';

export type DynamoDockPart =
  'root' | 'list' | 'item' | 'icon' | 'label' | 'badge';
