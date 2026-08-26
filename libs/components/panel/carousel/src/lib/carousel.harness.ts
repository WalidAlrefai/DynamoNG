import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoCarousel, for use in consumer app tests. */
export class DynamoCarouselHarness extends ComponentHarness {
  static hostSelector = 'dg-carousel';

  private readonly slideLocators = this.locatorForAll('[role="group"]');
  private readonly dotLocators = this.locatorForAll('[role="tablist"] button');
  private readonly prevButtonLocator = this.locatorForOptional(
    'button[aria-label="Previous slide"]',
  );
  private readonly nextButtonLocator = this.locatorForOptional(
    'button[aria-label="Next slide"]',
  );

  async getSlideCount(): Promise<number> {
    return (await this.slideLocators()).length;
  }

  async getActiveIndex(): Promise<number> {
    const dots = await this.dotLocators();
    for (let i = 0; i < dots.length; i++) {
      if ((await dots[i]?.getAttribute('aria-selected')) === 'true') {
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

  async goTo(index: number): Promise<void> {
    const dots = await this.dotLocators();
    await dots[index]?.click();
  }
}
