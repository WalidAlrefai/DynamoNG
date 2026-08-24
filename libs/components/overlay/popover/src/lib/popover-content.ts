import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  viewChild,
} from '@angular/core';

/**
 * Captures the popover's body content as a `TemplateRef` — renders no DOM of
 * its own. `DynamoPopover` stamps this out via `ngTemplateOutlet` inside its
 * CDK-portaled panel, so a plain `<ng-content>` (fixed at its declaration
 * point) can't be used for this half of the projection the way it is for the
 * trigger — the panel content must be relocatable. Same content-marker
 * pattern as `DynamoTab`/`DynamoStep`/`DynamoAccordionPanel`.
 */
@Component({
  selector: 'dg-popover-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './popover-content.html',
})
export class DynamoPopoverContent {
  readonly contentTemplate =
    viewChild.required<TemplateRef<unknown>>('content');
}
