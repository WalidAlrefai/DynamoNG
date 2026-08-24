import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

/**
 * A single step's metadata + projected content. Renders no DOM of its own —
 * `DynamoStepper` reads these via a content query and stamps out the step
 * indicator button and panel itself, so `styleClass`/`pt`/`unstyled` (which
 * would have nothing to apply to here) live on `DynamoStepper` instead. This
 * is why, like `DynamoTab`, this does not extend `DynamoBaseComponent`.
 */
@Component({
  selector: 'dg-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step.html',
})
export class DynamoStep {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  /** An explicitly-skippable step (e.g. an optional one) — same semantics as DynamoTab's disabled. */
  readonly disabled = input(false);

  readonly contentTemplate =
    viewChild.required<TemplateRef<unknown>>('content');

  /** Latches true the first time this step becomes active; never reset — drives lazy first-mount, then the panel stays mounted (hidden, not destroyed) forever after. */
  readonly hasBeenActivated = signal(false);
}
