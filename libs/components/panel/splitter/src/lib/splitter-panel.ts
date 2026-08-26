import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  viewChild,
} from '@angular/core';

/**
 * A single pane's size constraints + projected content. Renders no DOM of
 * its own — `DynamoSplitter` reads these via a content query and stamps out
 * the sized wrapper `<div>` itself, so `styleClass`/`pt`/`unstyled` (which
 * would have nothing to apply to here) live on `DynamoSplitter` instead.
 * Same shape as `DynamoTab`/`DynamoTabs` — this is why, unlike every other
 * DynamoNG component, this one does not extend `DynamoBaseComponent`.
 */
@Component({
  selector: 'dg-splitter-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './splitter-panel.html',
})
export class DynamoSplitterPanel {
  /** Initial size as a percentage (0-100). Omitted panels split the remainder evenly. */
  readonly initialSize = input<number | undefined>(undefined);
  readonly minSize = input(0);

  readonly contentTemplate =
    viewChild.required<TemplateRef<unknown>>('content');
}
