import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Content-only holder read by `DynamoMenu` via `contentChildren()`. Unlike
// `DynamoTab`/`DynamoAccordionPanel`, a menu item's visible content is fully
// described by `label` — no projected body, so no `contentTemplate`/
// `ng-content` machinery is needed. Renders no DOM of its own, so (like its
// Tab/AccordionPanel counterparts) this deliberately does not extend
// `DynamoBaseComponent`.
@Component({
  selector: 'dg-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DynamoMenuItem {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly disabled = input(false);
  /** Optional short glyph/text rendered before the label — e.g. a Unicode
   *  symbol or emoji. Not connected to `@dynamong/icons` (which only
   *  exports one fixed checkmark glyph today, not a general
   *  icon-selection system) — same plain-string shape as
   *  `DynamoSpeedDialAction.icon`. */
  readonly icon = input<string | undefined>(undefined);
  /** Renders this row as a non-interactive divider instead of a command —
   *  `value`/`label` are still required inputs but are ignored; pass empty
   *  strings (`value="" label=""`). Kept on the same item type rather than
   *  a separate component so a single `contentChildren(DynamoMenuItem)`
   *  query stays the sole source of author order. */
  readonly separator = input(false);
}
