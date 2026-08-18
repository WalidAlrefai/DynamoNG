import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

/**
 * A single tab's metadata + projected content. Renders no DOM of its own —
 * `DynamoTabs` reads these via a content query and stamps out the tablist
 * button and panel itself, so `styleClass`/`pt`/`unstyled` (which would have
 * nothing to apply to here) live on `DynamoTabs` instead. This is why, unlike
 * every other DynamoNG component, this one does not extend
 * `DynamoBaseComponent`.
 */
@Component({
  selector: 'dg-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tab.html',
})
export class DynamoTab {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly disabled = input(false);

  readonly contentTemplate =
    viewChild.required<TemplateRef<unknown>>('content');

  /** Latches true the first time this tab becomes active; never reset — drives lazy first-mount, then the panel stays mounted (hidden, not destroyed) forever after. */
  readonly hasBeenActivated = signal(false);
}
