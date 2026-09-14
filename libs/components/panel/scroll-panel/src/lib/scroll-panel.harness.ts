import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoScrollPanel, for use in consumer app tests. */
export class DynamoScrollPanelHarness extends ComponentHarness {
  static hostSelector = 'dg-scroll-panel';

  private readonly viewportLocator = this.locatorFor(
    '[data-testid="dg-scroll-panel-viewport"]',
  );
  private readonly thumbYLocator = this.locatorForOptional(
    '[data-testid="dg-scroll-panel-thumb-y"]',
  );
  private readonly thumbXLocator = this.locatorForOptional(
    '[data-testid="dg-scroll-panel-thumb-x"]',
  );

  async getScrollTop(): Promise<number> {
    const viewport = await this.viewportLocator();
    return Number(await viewport.getProperty('scrollTop'));
  }

  async getScrollLeft(): Promise<number> {
    const viewport = await this.viewportLocator();
    return Number(await viewport.getProperty('scrollLeft'));
  }

  async hasVerticalThumb(): Promise<boolean> {
    return (await this.thumbYLocator()) !== null;
  }

  async hasHorizontalThumb(): Promise<boolean> {
    return (await this.thumbXLocator()) !== null;
  }
}
