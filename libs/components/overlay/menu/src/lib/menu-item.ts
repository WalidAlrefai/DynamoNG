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
  /** When explicitly `false`, this item is omitted from render AND
   *  keyboard navigation entirely (not just dimmed, unlike `disabled`).
   *  Defaults to visible when omitted. */
  readonly visible = input(true);
  /** Display-only keyboard-shortcut hint text (e.g. `"⌘K"`), rendered as
   *  trailing, `aria-hidden` content. Purely cosmetic — registers no
   *  actual key binding. */
  readonly shortcut = input<string | undefined>(undefined);
  /** A small trailing badge/count, rendered via `@dynamong/badge`. Purely
   *  cosmetic — no keyboard/command semantics. */
  readonly badge = input<string | number | undefined>(undefined);
  /** Navigates via Angular Router instead of (or alongside) `itemSelect`'s
   *  own `(click)` handler when set. Same shape as RouterLink's own
   *  `routerLink` input. Every `DynamoMenuItem` is already a leaf (no
   *  branches/children exist in this component), so there's no leaf-only
   *  caveat the way Menubar's/TieredMenu's own `routerLink` field has. */
  readonly routerLink = input<string | string[] | undefined>(undefined);
  /** Forwarded to RouterLink's own `queryParams` input when `routerLink` is set. */
  readonly queryParams = input<Record<string, unknown> | undefined>(undefined);
  /** Forwarded to RouterLink's own `fragment` input when `routerLink` is set. */
  readonly fragment = input<string | undefined>(undefined);
}
