// Ensures the pressed state doesn't shrink the button: DynamoButton's
// `solid` variant (pressed) draws no border, while `outline` (unpressed)
// draws a real 1px one — since the button is `inline-flex` with no
// explicit width, removing a border shrinks the whole rendered box, not
// just its content area. Reserving the same 1px as a transparent border
// when pressed keeps the box identical regardless of state (same fix as
// Select Button's segments).
export function toggleButtonBorderStyles(pressed: boolean): string {
  return pressed ? 'border border-transparent' : '';
}
