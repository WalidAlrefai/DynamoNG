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
}
