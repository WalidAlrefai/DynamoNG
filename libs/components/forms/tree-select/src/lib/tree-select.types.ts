export type DynamoTreeSelectPart =
  | 'root'
  | 'trigger'
  | 'chevron'
  | 'clear'
  | 'panel'
  | 'row'
  | 'expandButton'
  | 'checkbox'
  | 'filterInput'
  | 'no-results';

/** `'checkbox'` cascades (tri-state, descendants follow the branch) — the original, always-cascading
 *  model. `'single'`/`'multiple'` are non-cascading: `'single'` replaces the selection on click,
 *  `'multiple'` toggles plain membership with a bare click — no modifier key. */
export type DynamoTreeSelectSelectionMode = 'single' | 'multiple' | 'checkbox';
