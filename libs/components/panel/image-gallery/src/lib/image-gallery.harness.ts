import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoImageGallery, for use in consumer app tests. */
export class DynamoImageGalleryHarness extends ComponentHarness {
  static hostSelector = 'dg-image-gallery';

  private readonly mainButtonLocator = this.locatorForOptional(
    'button[aria-label^="View fullscreen"]',
  );
  private readonly thumbnailLocators = this.locatorForAll('[role="tab"]');
  private readonly prevButtonLocator = this.locatorForOptional(
    'button[aria-label="Previous image"]',
  );
  private readonly nextButtonLocator = this.locatorForOptional(
    'button[aria-label="Next image"]',
  );
  private readonly lightboxLocator = this.locatorForOptional('[role="dialog"]');
  private readonly lightboxCloseButtonLocator = this.locatorForOptional(
    'button[aria-label="Close"]',
  );

  async getImageCount(): Promise<number> {
    return (await this.thumbnailLocators()).length;
  }

  async getActiveIndex(): Promise<number> {
    const thumbnails = await this.thumbnailLocators();
    for (let i = 0; i < thumbnails.length; i++) {
      if ((await thumbnails[i]?.getAttribute('aria-selected')) === 'true') {
        return i;
      }
    }
    return 0;
  }

  async next(): Promise<void> {
    await (await this.nextButtonLocator())?.click();
  }

  async prev(): Promise<void> {
    await (await this.prevButtonLocator())?.click();
  }

  async goToThumbnail(index: number): Promise<void> {
    const thumbnails = await this.thumbnailLocators();
    await thumbnails[index]?.click();
  }

  async openLightbox(): Promise<void> {
    await (await this.mainButtonLocator())?.click();
  }

  async closeLightbox(): Promise<void> {
    await (await this.lightboxCloseButtonLocator())?.click();
  }

  async isLightboxOpen(): Promise<boolean> {
    return (await this.lightboxLocator()) !== null;
  }
}
