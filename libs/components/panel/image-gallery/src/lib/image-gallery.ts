import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { ConfigurableFocusTrap } from '@angular/cdk/a11y';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoFocusTrapService } from '@dynamong/core/a11y';
import { DynamoButton } from '@dynamong/button';
import { cn } from '@dynamong/utils/class-merge';
import { isBrowser } from '@dynamong/utils/dom';
import {
  imageGalleryFallbackStyles,
  imageGalleryLightboxBackdropStyles,
  imageGalleryLightboxCaptionStyles,
  imageGalleryLightboxCloseButtonStyles,
  imageGalleryLightboxImageStyles,
  imageGalleryLightboxNextArrowStyles,
  imageGalleryLightboxPanelStyles,
  imageGalleryLightboxPrevArrowStyles,
  imageGalleryMainButtonStyles,
  imageGalleryMainImageStyles,
  imageGalleryNextArrowStyles,
  imageGalleryPrevArrowStyles,
  imageGalleryRootStyles,
  imageGalleryThumbnailImageStyles,
  imageGalleryThumbnailStyles,
  imageGalleryThumbnailsStyles,
  imageGalleryViewportStyles,
} from './image-gallery.styles';
import type {
  DynamoGalleryImage,
  DynamoImageGalleryAspectRatio,
  DynamoImageGalleryPart,
} from './image-gallery.types';

/**
 * A main image viewer with a thumbnail strip and a fullscreen lightbox.
 *
 * The lightbox is a plain `position: fixed` backdrop + panel gated by an
 * internal signal, reusing `DynamoFocusTrapService` exactly like Dialog does
 * — deliberately NOT a dependency on `@dynamong/dialog` itself. Nothing in
 * this codebase composes one overlay-domain component from another; each
 * (Dialog, Drawer, Tooltip) independently re-implements this same
 * fixed-position shape, sharing only the `type:core` a11y/overlay services.
 * This component follows that same convention rather than introducing the
 * first-ever component-to-component overlay composition.
 */
@Component({
  selector: 'dg-image-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton],
  templateUrl: './image-gallery.html',
})
export class DynamoImageGallery extends DynamoBaseComponent<DynamoImageGalleryPart> {
  readonly images = input.required<DynamoGalleryImage[]>();
  /** Two-way bindable: `<dg-image-gallery [(activeIndex)]="index">`. */
  readonly activeIndex = model(0);
  readonly loop = input(true);
  readonly aspectRatio = input<DynamoImageGalleryAspectRatio>('video');
  readonly showThumbnails = input(true);
  readonly ariaLabel = input<string | undefined>(undefined);

  private readonly thumbnailButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('thumbnailButton');
  private readonly lightboxPanelRef =
    viewChild<ElementRef<HTMLElement>>('lightboxPanel');
  private readonly focusTrapService = inject(DynamoFocusTrapService);

  private focusTrap: ConfigurableFocusTrap | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  /** Broken (`(error)`-fired) image indices — mirrors Avatar's single-image
   * `imageFailed` idiom, generalized to a collection since a gallery has
   * many images rather than one. */
  private readonly failedIndices = signal<ReadonlySet<number>>(new Set());
  protected readonly lightboxOpen = signal(false);

  protected readonly activeImage = computed(() => this.images()[this.activeIndex()]);

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(imageGalleryRootStyles, this.styleClass()),
  );
  protected readonly viewportClasses = computed(() =>
    imageGalleryViewportStyles({ aspectRatio: this.aspectRatio() }),
  );
  protected readonly mainButtonClasses = imageGalleryMainButtonStyles;
  protected readonly mainImageClasses = imageGalleryMainImageStyles;
  protected readonly prevArrowClasses = imageGalleryPrevArrowStyles;
  protected readonly nextArrowClasses = imageGalleryNextArrowStyles;
  protected readonly thumbnailsClasses = imageGalleryThumbnailsStyles;
  protected readonly thumbnailImageClasses = imageGalleryThumbnailImageStyles;
  protected readonly fallbackClasses = imageGalleryFallbackStyles;
  protected readonly lightboxBackdropClasses = imageGalleryLightboxBackdropStyles;
  protected readonly lightboxPanelClasses = imageGalleryLightboxPanelStyles;
  protected readonly lightboxImageClasses = imageGalleryLightboxImageStyles;
  protected readonly lightboxCaptionClasses = imageGalleryLightboxCaptionStyles;
  protected readonly lightboxCloseButtonClasses = imageGalleryLightboxCloseButtonStyles;
  protected readonly lightboxPrevArrowClasses = imageGalleryLightboxPrevArrowStyles;
  protected readonly lightboxNextArrowClasses = imageGalleryLightboxNextArrowStyles;

  constructor() {
    super();
    effect(() => {
      const panel = this.lightboxPanelRef()?.nativeElement;
      if (this.lightboxOpen() && panel) {
        this.activateFocusTrap(panel);
      } else if (!this.lightboxOpen()) {
        this.releaseFocusTrap();
      }
    });
  }

  protected thumbnailClasses(active: boolean) {
    return imageGalleryThumbnailStyles({ active });
  }

  protected thumbnailSrc(image: DynamoGalleryImage): string {
    return image.thumbnailSrc ?? image.src;
  }

  protected hasFailed(index: number): boolean {
    return this.failedIndices().has(index);
  }

  protected onImageError(index: number): void {
    this.failedIndices.update((failed) => new Set(failed).add(index));
  }

  protected imageAriaLabel(index: number): string {
    return `${index + 1} of ${this.images().length}`;
  }

  protected canPrev(): boolean {
    return this.loop() || this.activeIndex() > 0;
  }

  protected canNext(): boolean {
    return this.loop() || this.activeIndex() < this.images().length - 1;
  }

  protected next(): void {
    this.goToRelative(1);
  }

  protected prev(): void {
    this.goToRelative(-1);
  }

  private goToRelative(delta: number): void {
    const count = this.images().length;
    if (count === 0) {
      return;
    }
    const target = this.activeIndex() + delta;
    this.goTo(this.loop() ? target : Math.min(Math.max(target, 0), count - 1));
  }

  protected goTo(index: number): void {
    const count = this.images().length;
    if (count === 0) {
      return;
    }
    this.activeIndex.set(((index % count) + count) % count);
  }

  protected openLightbox(): void {
    if (this.images().length === 0) {
      return;
    }
    this.lightboxOpen.set(true);
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  protected onViewportKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'Home':
        event.preventDefault();
        this.goTo(0);
        break;
      case 'End':
        event.preventDefault();
        this.goTo(this.images().length - 1);
        break;
    }
  }

  // Same simplified roving-tabindex scan as Carousel's onIndicatorKeydown —
  // thumbnails have no per-image "disabled" concept, so it's plain wrapping
  // arithmetic rather than a skip-disabled loop. Arrow navigation activates
  // immediately (automatic activation), matching the indicator-dot precedent.
  protected onThumbnailKeydown(event: KeyboardEvent): void {
    const buttons = this.thumbnailButtons();
    const count = buttons.length;
    const currentIndex = buttons.findIndex((ref) => ref.nativeElement === event.target);
    if (currentIndex === -1 || count === 0) {
      return;
    }

    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % count;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + count) % count;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (nextIndex === currentIndex) {
      return;
    }
    buttons[nextIndex]?.nativeElement.focus();
    this.goTo(nextIndex);
  }

  private activateFocusTrap(panel: HTMLElement): void {
    if (this.focusTrap) {
      return;
    }
    if (isBrowser()) {
      this.previouslyFocusedElement = document.activeElement as HTMLElement | null;
    }
    this.focusTrap = this.focusTrapService.create(panel);
    // Same reasoning as Dialog: the focus trap's own initial-focus routine
    // resolves asynchronously; move focus into the panel synchronously too so
    // it's never left on whatever triggered the lightbox.
    panel.focus();
  }

  private releaseFocusTrap(): void {
    if (!this.focusTrap) {
      return;
    }
    this.focusTrap.destroy();
    this.focusTrap = null;
    this.previouslyFocusedElement?.focus();
    this.previouslyFocusedElement = null;
  }
}
