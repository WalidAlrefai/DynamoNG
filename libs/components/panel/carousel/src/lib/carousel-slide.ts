import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  viewChild,
} from '@angular/core';

/**
 * A single slide's projected content. Renders no DOM of its own —
 * `DynamoCarousel` reads these via a content query and stamps out the slide
 * wrapper itself, so `styleClass`/`pt`/`unstyled` (which would have nothing
 * to apply to here) live on `DynamoCarousel` instead. Same shape as
 * `DynamoStep`/`DynamoTab`.
 */
@Component({
  selector: 'dg-carousel-slide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carousel-slide.html',
})
export class DynamoCarouselSlide {
  readonly contentTemplate =
    viewChild.required<TemplateRef<unknown>>('content');
}
