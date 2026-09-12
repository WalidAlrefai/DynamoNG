export type DynamoMenuPosition =
  'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export type DynamoMenuPart = 'root' | 'trigger' | 'panel' | 'item';

/** `itemSelect` payload for Menu/ContextMenu/SplitButton — a plain snapshot, never the `DynamoMenuItem` component instance itself. */
export interface DynamoMenuItemSelectEvent {
  value: string;
  label: string;
  disabled: boolean;
}
