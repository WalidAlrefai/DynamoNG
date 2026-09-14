export type DynamoDividerOrientation = 'horizontal' | 'vertical';
export type DynamoDividerLineStyle = 'solid' | 'dashed' | 'dotted';
// 'left'/'right' apply when orientation is horizontal, 'top'/'bottom' when
// vertical; a mismatched pairing (e.g. 'top' with horizontal) falls back to
// 'center'. 'center' applies to both.
export type DynamoDividerAlign = 'left' | 'center' | 'right' | 'top' | 'bottom';
export type DynamoDividerPart = 'root' | 'line' | 'label';
