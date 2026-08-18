import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

// Content-only holder read by `DynamoAccordion` via `contentChildren()`.
// Renders no DOM of its own — `DynamoAccordion` owns all header/content
// markup and styling, so this deliberately does not extend
// `DynamoBaseComponent` (no `styleClass`/`pt`/`unstyled` would apply here).
@Component({
  selector: 'dg-accordion-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accordion-panel.html',
})
export class DynamoAccordionPanel {
  readonly value = input.required<string>();
  readonly header = input.required<string>();
  readonly disabled = input(false);

  readonly contentTemplate =
    viewChild.required<TemplateRef<unknown>>('content');

  // Latches true the first time this panel expands; content stays mounted
  // (hidden, not destroyed) afterward so in-panel state survives toggling.
  readonly hasBeenActivated = signal(false);
}
